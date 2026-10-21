/**
 * GET /api/admin/founding-talent
 * Protected, READ-ONLY endpoint for the GO4AI | Founding Talent Survey dashboard.
 *
 * Auth: identical mechanism to /api/admin/baogiaxnk — server-side ADMIN_ACCESS_KEY,
 * Bearer / X-Admin-Key header, timing-safe compare, per-IP brute-force jail.
 *
 * Query params:
 *   submission_id  -> single record detail
 *   q1, q5         -> exact answer filter
 *   q4, q6         -> "contains option" filter (json_each)
 *   from, to       -> ISO-8601 UTC instant range on created_at
 *   search         -> free-text search over Q2, Q7 and every "Khác" field
 *   limit, offset  -> pagination (max 500)
 *   export=csv     -> text/csv of the current filtered set (no pagination)
 *
 * Security: parameterized queries only, whitelisted columns, no-store headers,
 * mutations rejected with 405, no raw SQL errors returned.
 */

import { recordIpFailure, logSecurityEvent, sanitizeField } from '../_security.js';

const ADMIN_FAILURES = new Map();
const JAIL_THRESHOLD = 4;
const JAIL_DURATION_MS = 10 * 60 * 1000;

function checkAdminJail(clientIp) {
  const now = Date.now();
  const rec = ADMIN_FAILURES.get(clientIp);
  if (rec && rec.jailUntil && now < rec.jailUntil) {
    const retrySec = Math.ceil((rec.jailUntil - now) / 1000);
    return {
      jailed: true,
      retrySec,
      error: `Địa chỉ IP của bạn tạm thời bị khóa do nhiều lần đăng nhập không thành công. Vui lòng thử lại sau ${retrySec} giây.`,
    };
  }
  return { jailed: false };
}

function recordAdminFailure(clientIp) {
  const now = Date.now();
  let rec = ADMIN_FAILURES.get(clientIp);
  if (!rec || now - rec.windowStart > 5 * 60 * 1000) {
    rec = { count: 1, windowStart: now, jailUntil: 0 };
  } else {
    rec.count += 1;
  }
  if (rec.count >= JAIL_THRESHOLD) rec.jailUntil = now + JAIL_DURATION_MS;
  ADMIN_FAILURES.set(clientIp, rec);
}

async function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const hashA = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(a)));
  const hashB = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(b)));
  let diff = 0;
  for (let i = 0; i < hashA.length; i++) diff |= hashA[i] ^ hashB[i];
  return diff === 0;
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const Q1_CODES = ['A', 'B', 'C', 'D', 'E', 'F'];
const Q4_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const Q5_CODES = ['A', 'B', 'C', 'D', 'E'];
const Q6_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const clientIp = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   '127.0.0.1';

  try {
    // ─── 1. JAIL ────────────────────────────────────────────────────────
    const jailStatus = checkAdminJail(clientIp);
    if (jailStatus.jailed) {
      logSecurityEvent({
        action: 'admin_ip_jailed',
        clientIp,
        status: 429,
        reasons: ['admin_brute_force_lockout'],
      });
      return new Response(JSON.stringify({ success: false, error: jailStatus.error }), {
        status: 429,
        headers: { ...headers, 'Retry-After': String(jailStatus.retrySec) },
      });
    }

    // ─── 2. AUTH ────────────────────────────────────────────────────────
    const configuredKey = (env.ADMIN_ACCESS_KEY || '').trim();
    if (!configuredKey) {
      logSecurityEvent({
        action: 'admin_key_not_configured',
        clientIp,
        status: 503,
        reasons: ['ADMIN_ACCESS_KEY_missing_in_env'],
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Hệ thống quản trị chưa được cấu hình khóa truy cập (ADMIN_ACCESS_KEY) trên máy chủ Cloudflare.',
      }), { status: 503, headers });
    }

    const authHeader = request.headers.get('authorization') || '';
    const providedKey = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (request.headers.get('x-admin-key') || '').trim();

    if (!providedKey) {
      recordAdminFailure(clientIp);
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({
        success: false,
        error: 'Yêu cầu khóa truy cập quản trị.',
      }), { status: 401, headers });
    }

    if (!(await timingSafeEqual(providedKey, configuredKey))) {
      recordAdminFailure(clientIp);
      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'admin_auth_failed',
        clientIp,
        status: 401,
        reasons: ['invalid_admin_key'],
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Khóa truy cập không hợp lệ. Vui lòng kiểm tra lại.',
      }), { status: 401, headers });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cơ sở dữ liệu D1 chưa sẵn sàng.',
      }), { status: 503, headers });
    }

    // ─── 3. QUERY PARAMS ────────────────────────────────────────────────
    const url = new URL(request.url);
    const submissionIdParam = sanitizeField(url.searchParams.get('submission_id') || '', 64);
    const q1 = sanitizeField(url.searchParams.get('q1') || '', 4).toUpperCase();
    const q4 = sanitizeField(url.searchParams.get('q4') || '', 4).toUpperCase();
    const q5 = sanitizeField(url.searchParams.get('q5') || '', 4).toUpperCase();
    const q6 = sanitizeField(url.searchParams.get('q6') || '', 4).toUpperCase();
    const from = sanitizeField(url.searchParams.get('from') || '', 32);
    const to = sanitizeField(url.searchParams.get('to') || '', 32);
    const search = sanitizeField(url.searchParams.get('search') || '', 120);
    const wantsCsv = url.searchParams.get('export') === 'csv';
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || '200', 10) || 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);

    // ─── 4. DETAIL ──────────────────────────────────────────────────────
    if (submissionIdParam) {
      const row = await env.DB.prepare(`
        SELECT * FROM founding_talent_surveys
        WHERE submission_id = ?
        LIMIT 1
      `).bind(submissionIdParam).first();

      if (!row) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Không tìm thấy bản ghi khảo sát.',
        }), { status: 404, headers });
      }

      return new Response(JSON.stringify({ success: true, item: formatRow(row) }), {
        status: 200,
        headers,
      });
    }

    // ─── 5. FILTER BUILDER (whitelisted, fully parameterized) ───────────
    const where = [];
    const params = [];

    if (q1 && Q1_CODES.includes(q1)) { where.push('q1_answer = ?'); params.push(q1); }
    if (q5 && Q5_CODES.includes(q5)) { where.push('q5_answer = ?'); params.push(q5); }
    if (q4 && Q4_CODES.includes(q4)) {
      where.push('EXISTS (SELECT 1 FROM json_each(founding_talent_surveys.q4_answers_json) WHERE json_each.value = ?)');
      params.push(q4);
    }
    if (q6 && Q6_CODES.includes(q6)) {
      where.push('EXISTS (SELECT 1 FROM json_each(founding_talent_surveys.q6_answers_json) WHERE json_each.value = ?)');
      params.push(q6);
    }
    if (from && ISO_INSTANT.test(from)) { where.push('created_at >= ?'); params.push(from); }
    if (to && ISO_INSTANT.test(to)) { where.push('created_at <= ?'); params.push(to); }

    if (search) {
      const like = '%' + search.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
      where.push(`(
        q2_text LIKE ? ESCAPE '\\' OR
        q7_text LIKE ? ESCAPE '\\' OR
        q1_other LIKE ? ESCAPE '\\' OR
        q3_other LIKE ? ESCAPE '\\' OR
        q5_other LIKE ? ESCAPE '\\' OR
        q6_other LIKE ? ESCAPE '\\' OR
        submission_id LIKE ? ESCAPE '\\'
      )`);
      params.push(like, like, like, like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // ─── 6. CSV EXPORT ──────────────────────────────────────────────────
    if (wantsCsv) {
      const csvRows = await env.DB.prepare(`
        SELECT * FROM founding_talent_surveys
        ${whereSql}
        ORDER BY created_at DESC, id DESC
        LIMIT 5000
      `).bind(...params).all();

      const items = (csvRows.results || []).map(formatRow);
      const csv = toCsv(items);

      return new Response('\uFEFF' + csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="founding-talent-surveys-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // ─── 7. LIST ────────────────────────────────────────────────────────
    const countRes = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM founding_talent_surveys ${whereSql}`
    ).bind(...params).first();

    const rows = await env.DB.prepare(`
      SELECT * FROM founding_talent_surveys
      ${whereSql}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    return new Response(JSON.stringify({
      success: true,
      total: countRes?.total || 0,
      limit,
      offset,
      items: (rows.results || []).map(formatRow),
    }), { status: 200, headers });

  } catch (err) {
    console.error('[admin-founding-talent] Query error:', err.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Lỗi truy xuất cơ sở dữ liệu.',
    }), { status: 500, headers });
  }
}

// ─── READ-ONLY GUARDS ────────────────────────────────────────────────────
export async function onRequestOptions(context) {
  const headers = getCorsHeaders(context.request);
  headers['Access-Control-Max-Age'] = '86400';
  return new Response(null, { status: 204, headers });
}

export async function onRequestPost(context) { return methodNotAllowed(context.request); }
export async function onRequestPut(context) { return methodNotAllowed(context.request); }
export async function onRequestDelete(context) { return methodNotAllowed(context.request); }
export async function onRequestPatch(context) { return methodNotAllowed(context.request); }

function methodNotAllowed(request) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Chế độ chỉ đọc (Read-only). Không hỗ trợ phương thức này.',
  }), { status: 405, headers: getCorsHeaders(request) });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
function parseList(json) {
  try {
    const arr = JSON.parse(json || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function formatRow(row) {
  return {
    id: row.id,
    submission_id: row.submission_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    q1: row.q1_answer || '',
    q1_other: row.q1_other || '',
    q2_text: row.q2_text || '',
    q3: parseList(row.q3_answers_json),
    q3_other: row.q3_other || '',
    q4: parseList(row.q4_answers_json),
    q5: row.q5_answer || '',
    q5_other: row.q5_other || '',
    q6: parseList(row.q6_answers_json),
    q6_other: row.q6_other || '',
    q7_text: row.q7_text || '',
    source: row.source || '',
    page_path: row.page_path || '',
    utm_source: row.utm_source || '',
    utm_campaign: row.utm_campaign || '',
    referrer: row.referrer || '',
  };
}

function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return '"' + s.replace(/"/g, '""') + '"';
}

function toCsv(items) {
  const head = [
    'created_at', 'submission_id',
    'q1_answer', 'q1_other', 'q2_text',
    'q3_answers', 'q3_other', 'q4_answers',
    'q5_answer', 'q5_other', 'q6_answers', 'q6_other', 'q7_text',
    'source', 'page_path', 'utm_source', 'utm_campaign', 'referrer',
  ];
  const lines = [head.map(csvCell).join(',')];
  for (const it of items) {
    lines.push([
      it.created_at, it.submission_id,
      it.q1, it.q1_other, it.q2_text,
      it.q3.join(' | '), it.q3_other, it.q4.join(' | '),
      it.q5, it.q5_other, it.q6.join(' | '), it.q6_other, it.q7_text,
      it.source, it.page_path, it.utm_source, it.utm_campaign, it.referrer,
    ].map(csvCell).join(','));
  }
  return lines.join('\r\n');
}

function getCorsHeaders(request) {
  const origin = (request && request.headers ? request.headers.get('Origin') : '') || '';
  const isAllowedOrigin =
    origin === 'https://b2b.go4ai.org' ||
    origin.endsWith('.b2b-go4ai.pages.dev') ||
    origin === 'https://b2b-go4ai.pages.dev' ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:');
  const allowOrigin = isAllowedOrigin ? origin : 'https://b2b.go4ai.org';

  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Surrogate-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
  };
}
