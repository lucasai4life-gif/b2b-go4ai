import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestPost } from '../functions/api/leads.js';
import { onRequestPost as onOpportunityPost } from '../functions/api/lead-opportunity.js';

let nextIp = 10;

function createDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_create_leads.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_security_hardening.sql', import.meta.url), 'utf8'));
  let failNextInsert = false;
  return {
    sqlite,
    clientIp: `203.0.113.${nextIp++}`,
    failNextInsert() { failNextInsert = true; },
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() { return sqlite.prepare(sql).get(...values) || null; },
            async run() {
              if (failNextInsert && /INSERT INTO leads/i.test(sql)) {
                failNextInsert = false;
                throw new Error('simulated D1 outage');
              }
              const result = sqlite.prepare(sql).run(...values);
              return { success: true, meta: { last_row_id: Number(result.lastInsertRowid), changes: result.changes } };
            },
          };
        },
      };
    },
  };
}

function requestFor(email, extra = {}, clientIp) {
  return new Request('https://b2b.go4ai.org/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': clientIp },
    body: JSON.stringify({
      leadType: 'enterprise_consultation',
      source: 'test',
      name: 'Alice',
      company: 'Example Co',
      email,
      phone: '0900000000',
      turnstileToken: 'test-token',
      ...extra,
    }),
  });
}

async function submit(db, email, extra = {}, envExtra = {}) {
  const response = await onRequestPost({
    request: requestFor(email, extra, db.clientIp),
    env: { DB: db, TURNSTILE_SECRET_KEY: 'test-secret', ...envExtra },
  });
  return { status: response.status, body: await response.json() };
}

test('an old ISO timestamp does not count toward the ten-minute limit', async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 });
  const db = createDb();
  try {
    const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    for (let i = 0; i < 2; i++) {
      db.sqlite.prepare('INSERT INTO leads (lead_type, source, email, phone, created_at) VALUES (?, ?, ?, ?, ?)')
        .run('enterprise_consultation', 'test', 'old@example.com', '0900000000', oldTime);
    }
    const result = await submit(db, 'old@example.com');
    assert.equal(result.status, 201);
    assert.equal(result.body.success, true);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get().count, 3);
  } finally {
    globalThis.fetch = oldFetch;
    db.sqlite.close();
  }
});

test('a failed D1 insert never makes a retry look successful without a row', async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 });
  const db = createDb();
  try {
    db.failNextInsert();
    const failed = await submit(db, 'retry@example.com');
    assert.equal(failed.status, 500);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get().count, 0);

    const retried = await submit(db, 'retry@example.com');
    assert.equal(retried.status, 201);
    assert.equal(retried.body.success, true);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get().count, 1);

    const duplicate = await submit(db, 'retry@example.com');
    assert.equal(duplicate.status, 200);
    assert.equal(duplicate.body.duplicate, true);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get().count, 1);
  } finally {
    globalThis.fetch = oldFetch;
    db.sqlite.close();
  }
});

test('a Telegram failure keeps the lead and records an error status', async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/siteverify')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    throw new Error('simulated Telegram outage');
  };
  const db = createDb();
  try {
    const result = await submit(db, 'telegram@example.com', {}, {
      TELEGRAM_BOT_TOKEN: 'test-token',
      TELEGRAM_CHAT_ID: 'test-chat',
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.telegramStatus, 'error');
    assert.equal(db.sqlite.prepare('SELECT telegram_status FROM leads').get().telegram_status, 'error');
  } finally {
    globalThis.fetch = oldFetch;
    db.sqlite.close();
  }
});

test('two distinct accepted leads from one email each notify Telegram', async () => {
  const oldFetch = globalThis.fetch;
  let telegramCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/siteverify')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    telegramCalls += 1;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const db = createDb();
  try {
    const env = { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'test-chat' };
    const first = await submit(db, 'two@example.com', { problem: 'First request' }, env);
    const second = await submit(db, 'two@example.com', { problem: 'Second request' }, env);
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(telegramCalls, 2);
    assert.deepEqual(
      db.sqlite.prepare('SELECT telegram_status FROM leads ORDER BY id').all().map(row => row.telegram_status),
      ['sent', 'sent'],
    );
  } finally {
    globalThis.fetch = oldFetch;
    db.sqlite.close();
  }
});

test('missing Turnstile secret rejects the lead before D1', async () => {
  const db = createDb();
  try {
    const response = await onRequestPost({
      request: requestFor('no-secret@example.com', {}, db.clientIp),
      env: { DB: db },
    });
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.code, 'TURNSTILE_NOT_CONFIGURED');
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get().count, 0);
  } finally {
    db.sqlite.close();
  }
});

test('Claude registration persists three contact fields, then qualifies the same row once', async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 });
  const db = createDb();
  try {
    const registered = await submit(db, 'claude@example.com', {
      leadType: 'claude_workshop_registration', source: 'claude_landing_page',
    });
    assert.equal(registered.status, 201);
    assert.ok(registered.body.opportunityToken);
    const row = db.sqlite.prepare('SELECT * FROM leads WHERE id = ?').get(registered.body.leadId);
    assert.equal(JSON.parse(row.payload_json).workshop_source, 'claude_landing_page');
    assert.ok(JSON.parse(row.payload_json).registered_at);
    assert.equal(JSON.parse(row.payload_json).opportunity_type, undefined);
    const duplicate = await submit(db, 'claude@example.com', {
      leadType: 'claude_workshop_registration', source: 'claude_landing_page',
    });
    assert.equal(duplicate.status, 200);
    assert.equal(duplicate.body.leadId, registered.body.leadId);
    assert.ok(duplicate.body.opportunityToken);
    const payload = {
      leadId: registered.body.leadId, opportunityToken: registered.body.opportunityToken,
      opportunityType: 'BUILD', currentRole: 'Quản lý',
      primaryGoal: 'Phát triển doanh nghiệp', startTimeline: 'Trong 1 tháng',
    };
    const request = data => new Request('https://b2b.go4ai.org/api/lead-opportunity', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
    });
    const forged = await onOpportunityPost({ request: request({ ...payload, opportunityToken: payload.opportunityToken.slice(0, -1) + (payload.opportunityToken.endsWith('0') ? '1' : '0') }), env: { DB: db, TURNSTILE_SECRET_KEY: 'test-secret' } });
    assert.equal(forged.status, 403);
    const saved = await onOpportunityPost({ request: request(payload), env: { DB: db, TURNSTILE_SECRET_KEY: 'test-secret' } });
    assert.equal(saved.status, 200);
    const savedRow = JSON.parse(db.sqlite.prepare('SELECT payload_json FROM leads WHERE id = ?').get(registered.body.leadId).payload_json);
    assert.equal(savedRow.opportunity_type, 'BUILD');
    assert.equal(savedRow.sales_route, 'STRATEGIC_100M');
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get().count, 1);
    const replay = await onOpportunityPost({ request: request(payload), env: { DB: db, TURNSTILE_SECRET_KEY: 'test-secret' } });
    assert.equal(replay.status, 409);
  } finally {
    globalThis.fetch = oldFetch;
    db.sqlite.close();
  }
});
