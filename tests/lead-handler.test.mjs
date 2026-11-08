import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestPost } from '../functions/api/leads.js';
import { onRequestPost as onOpportunityPost } from '../functions/api/lead-opportunity.js';
import { onRequestPost as onFoundationLeadPost } from '../functions/api/foundation-leads.js';
import {
  onRequestGet as onAdminFoundationGet,
  onRequestPatch as onAdminFoundationPatch,
} from '../functions/api/admin/foundation-leads.js';

let nextIp = 10;

function createDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_create_leads.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_security_hardening.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0003_founding_talent_leads.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0007_extend_leads_for_program_management.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0008_create_foundation_leads.sql', import.meta.url), 'utf8'));
  let failNextInsert = false;
  return {
    sqlite,
    clientIp: `203.0.113.${nextIp++}`,
    failNextInsert() { failNextInsert = true; },
    prepare(sql) {
      const execWithValues = (...values) => ({
        async first() { return sqlite.prepare(sql).get(...values) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...values) || [] }; },
        async run() {
          if (failNextInsert && /INSERT INTO (leads|foundation_leads)/i.test(sql)) {
            failNextInsert = false;
            throw new Error('simulated D1 outage');
          }
          const result = sqlite.prepare(sql).run(...values);
          return { success: true, meta: { last_row_id: Number(result.lastInsertRowid), changes: result.changes } };
        },
      });
      return {
        ...execWithValues(),
        bind(...values) {
          return execWithValues(...values);
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

test('membership interest from /opp/ stores the package, and two packages are two leads', async () => {
  const oldFetch = globalThis.fetch;
  const telegramTexts = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/siteverify')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    telegramTexts.push(JSON.parse(init.body).text);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const db = createDb();
  try {
    const env = { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'test-chat' };
    const base = { leadType: 'membership_interest', source: 'opp_landing_page', company: '' };
    const learn = await submit(db, 'member@example.com', { ...base, package: 'LEARN', startTimeline: 'Ngay' }, env);
    assert.equal(learn.status, 201);
    const partner = await submit(db, 'member@example.com', {
      ...base, package: 'PARTNER', company: 'Example Co',
      message: 'Chúng tôi có kênh phân phối giáo dục tại miền Trung.', partnerHave: ['Network', 'Distribution'],
    }, env);
    assert.equal(partner.status, 201);
    const rows = db.sqlite.prepare("SELECT payload_json FROM leads WHERE lead_type = 'membership_interest' ORDER BY id").all()
      .map(row => JSON.parse(row.payload_json));
    assert.deepEqual(rows.map(row => row.package), ['LEARN', 'PARTNER']);
    assert.deepEqual(rows[1].partnerHave, ['Network', 'Distribution']);
    assert.match(telegramTexts[0], /LEARN — 10M\/năm/);
    assert.match(telegramTexts[1], /BUILD · tầng 03/);

    const invalid = await submit(db, 'other@example.com', { ...base, package: 'GOLD' });
    assert.equal(invalid.status, 422);
    const missing = await submit(db, 'other2@example.com', { ...base });
    assert.equal(missing.status, 422);
  } finally {
    globalThis.fetch = oldFetch;
    db.sqlite.close();
  }
});

test('founding talent lead captures all 10 fields, assigns FTC26 code, enforces uniqueness and notifies telegram', async () => {
  const telegramTexts = [];
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (url.includes('api.telegram.org')) {
      const body = JSON.parse(options.body);
      telegramTexts.push(body.text);
      return new Response(JSON.stringify({ ok: true }));
    }
    return oldFetch(url, options);
  };

  const db = createDb();
  try {
    const env = { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'test-chat' };
    const leadPayload = {
      fullName: 'Trần Thị Tuyết Hương',
      email: 'talent@example.com',
      phone: '0901234567',
      segment: 'student',
      organization: 'Đại học Quốc gia',
      strength: 'technology',
      project: 'Xây dựng chatbot tuyển sinh',
      motivation: 'Mong muốn học hỏi và tham gia đội ngũ nòng cốt GO4AI trong năm 2026.',
      mode: 'hybrid',
      hoursPerWeek: 12,
      acceptTerms: true,
      acceptPrivacy: true,
    };

    const req = new Request('https://b2b.go4ai.org/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': db.clientIp },
      body: JSON.stringify(leadPayload),
    });

    const res = await onRequestPost({
      request: req,
      env: { DB: db, ...env },
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.match(body.code, /^FTC26-[0-9A-F]{8}$/);

    // Verify row in D1
    const row = db.sqlite.prepare("SELECT * FROM leads WHERE lead_type = 'founding_talent'").get();
    assert.ok(row);
    assert.equal(row.email, 'talent@example.com');
    assert.equal(row.name, 'Trần Thị Tuyết Hương');
    assert.equal(row.company, 'Đại học Quốc gia');

    // Verify Telegram notification
    assert.equal(telegramTexts.length, 1);
    assert.match(telegramTexts[0], /Founding Talent 2026/);
    assert.match(telegramTexts[0], /Trần Thị Tuyết Hương/);
    assert.match(telegramTexts[0], /Đại học Quốc gia/);

    // Duplicate submission in same season is rejected with 409
    const dupReq = new Request('https://b2b.go4ai.org/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': db.clientIp },
      body: JSON.stringify(leadPayload),
    });
    const dupRes = await onRequestPost({
      request: dupReq,
      env: { DB: db, ...env },
    });
    assert.equal(dupRes.status, 409);
    const dupBody = await dupRes.json();
    assert.equal(dupBody.ok, false);
    assert.ok(dupBody.errors.email);

    // Honeypot submission returns 201 fake but does not insert row
    const hpReq = new Request('https://b2b.go4ai.org/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': db.clientIp },
      body: JSON.stringify({ ...leadPayload, email: 'bot@example.com', website: 'https://spam.bot' }),
    });
    const hpRes = await onRequestPost({
      request: hpReq,
      env: { DB: db, ...env },
    });
    assert.equal(hpRes.status, 201);
    const botRow = db.sqlite.prepare("SELECT * FROM leads WHERE email = 'bot@example.com'").get();
    assert.equal(botRow, undefined);
  } finally {
    globalThis.fetch = oldFetch;
    db.sqlite.close();
  }
});

test('AI Foundation lead capture + admin dashboard API: 6 QA cases, isolation from Cafe Talk, status/notes update & CSV export', async () => {
  const db = createDb();
  const env = { DB: db, ADMIN_ACCESS_KEY: 'foundation-admin-secret-2026' };

  const postFoundation = async (payload, ip = db.clientIp) => {
    const req = new Request('https://b2b.go4ai.org/api/foundation-leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
      body: JSON.stringify(payload),
    });
    const res = await onFoundationLeadPost({ request: req, env });
    return { status: res.status, body: await res.json() };
  };

  try {
    // Case 2: Missing privacy consent -> blocked (422)
    const noConsent = await postFoundation({
      full_name: 'Nguyễn Văn A',
      phone: '0901112223',
      job_title: 'Trưởng phòng vận hành',
      ai_goal: 'Tự động hóa báo cáo tuần',
      ai_experience: 'Đã dùng ChatGPT cơ bản',
      privacy_consent: false,
      marketing_consent: false,
    });
    assert.equal(noConsent.status, 422);
    assert.equal(noConsent.body.field, 'privacy_consent');
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM foundation_leads').get().count, 0);

    // Case 1 & Case 3: Valid form + privacy_consent = true + marketing_consent = false + client tries to spoof status/notes
    const validFalseMkt = await postFoundation({
      full_name: 'Nguyễn Văn A',
      phone: '+84 901 112 223',
      email: 'NguyenVanA@Example.com',
      job_title: 'Trưởng phòng vận hành',
      company: 'Công ty TNHH Alpha',
      ai_goal: 'Tự động hóa báo cáo tuần và Excel',
      ai_experience: 'Đã dùng ChatGPT cơ bản',
      privacy_consent: true,
      marketing_consent: false,
      status: 'ENROLLED',
      notes: 'Hacked note',
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'ai_foundation_nov',
      landing_path: '/ai-foundation',
    });
    assert.equal(validFalseMkt.status, 201);
    assert.equal(validFalseMkt.body.success, true);
    assert.equal(validFalseMkt.body.status, 'NEW');

    // Verify D1 record in foundation_leads and zero records in Cafe Talk `leads`
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get().count, 0);
    const row1 = db.sqlite.prepare('SELECT * FROM foundation_leads WHERE id = ?').get(validFalseMkt.body.leadId);
    assert.ok(row1);
    assert.equal(row1.phone, '0901112223');
    assert.equal(row1.email, 'nguyenvana@example.com');
    assert.equal(row1.privacy_consent, 1);
    assert.ok(row1.privacy_consent_at);
    assert.equal(row1.marketing_consent, 0);
    assert.equal(row1.status, 'NEW');
    assert.equal(row1.notes, '');

    // Case 5: Double-click / duplicate submission -> returns 200 duplicate without inserting second row
    const doubleClick = await postFoundation({
      full_name: 'Nguyễn Văn A',
      phone: '0901112223',
      email: 'nguyenvana@example.com',
      job_title: 'Trưởng phòng vận hành',
      company: 'Công ty TNHH Alpha',
      ai_goal: 'Tự động hóa báo cáo tuần và Excel',
      ai_experience: 'Đã dùng ChatGPT cơ bản',
      privacy_consent: true,
      marketing_consent: false,
    });
    assert.equal(doubleClick.status, 200);
    assert.equal(doubleClick.body.duplicate, true);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM foundation_leads').get().count, 1);

    // Case 4: Marketing consent = true
    const validTrueMkt = await postFoundation({
      full_name: 'Trần Thị B',
      phone: '0902223334',
      job_title: 'HR Manager',
      ai_goal: 'Xây dựng quy trình tuyển dụng bằng AI',
      ai_experience: 'Chưa dùng nhiều',
      privacy_consent: true,
      marketing_consent: true,
    }, '203.0.113.99');
    assert.equal(validTrueMkt.status, 201);
    const row2 = db.sqlite.prepare('SELECT * FROM foundation_leads WHERE id = ?').get(validTrueMkt.body.leadId);
    assert.equal(row2.marketing_consent, 1);

    // Case 6: Source = "Nguồn khác" requires other_source
    const missingOtherSource = await postFoundation({
      full_name: 'Lê Văn C',
      phone: '0903334445',
      source: 'Nguồn khác',
      other_source: '',
      privacy_consent: true,
    }, '203.0.113.100');
    assert.equal(missingOtherSource.status, 422);
    assert.equal(missingOtherSource.body.field, 'other_source');

    const validOtherSource = await postFoundation({
      full_name: 'Lê Văn C',
      phone: '0903334445',
      source: 'Nguồn khác',
      other_source: 'Cộng đồng AI Việt Nam',
      privacy_consent: true,
      marketing_consent: true,
    }, '203.0.113.100');
    assert.equal(validOtherSource.status, 201);

    // Admin API Auth check: unauthenticated request rejected with 401
    const unauthRes = await onAdminFoundationGet({
      request: new Request('https://b2b.go4ai.org/api/admin/foundation-leads', {
        headers: { 'cf-connecting-ip': '203.0.113.101' },
      }),
      env,
    });
    assert.equal(unauthRes.status, 401);

    // Admin API: list + summary
    const listRes = await onAdminFoundationGet({
      request: new Request('https://b2b.go4ai.org/api/admin/foundation-leads?search=Alpha', {
        headers: {
          authorization: 'Bearer foundation-admin-secret-2026',
          'cf-connecting-ip': '203.0.113.102',
        },
      }),
      env,
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.summary.total, 3);
    assert.equal(listData.summary.NEW, 3);
    assert.equal(listData.total, 1);
    assert.equal(listData.items[0].full_name, 'Nguyễn Văn A');

    // Admin API: update status to ENROLLED + internal notes
    const patchRes = await onAdminFoundationPatch({
      request: new Request('https://b2b.go4ai.org/api/admin/foundation-leads', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer foundation-admin-secret-2026',
          'cf-connecting-ip': '203.0.113.102',
        },
        body: JSON.stringify({
          id: validFalseMkt.body.leadId,
          status: 'ENROLLED',
          notes: 'Đã đóng học phí và xác nhận lịch khai giảng 18/11',
        }),
      }),
      env,
    });
    assert.equal(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.equal(patchData.item.status, 'ENROLLED');
    assert.equal(patchData.item.notes, 'Đã đóng học phí và xác nhận lịch khai giảng 18/11');

    // Admin API: CSV export
    const csvRes = await onAdminFoundationGet({
      request: new Request('https://b2b.go4ai.org/api/admin/foundation-leads?status=ENROLLED&export=csv', {
        headers: {
          authorization: 'Bearer foundation-admin-secret-2026',
          'cf-connecting-ip': '203.0.113.102',
        },
      }),
      env,
    });
    assert.equal(csvRes.status, 200);
    const csvBytes = new Uint8Array(await csvRes.clone().arrayBuffer());
    assert.equal(csvBytes[0], 0xef);
    assert.equal(csvBytes[1], 0xbb);
    assert.equal(csvBytes[2], 0xbf);
    const csvText = await csvRes.text();
    assert.match(csvText, /Nguyễn Văn A/);
    assert.match(csvText, /ENROLLED/);
    assert.doesNotMatch(csvText, /client_ip/);
  } finally {
    db.sqlite.close();
  }
});

