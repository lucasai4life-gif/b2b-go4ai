/**
 * /api/admin/leads
 * Protected Admin API for GO4AI Lead Management Dashboard (/admin/leads)
 *
 * Supports:
 * - GET /api/admin/leads          -> Paginated list + summary counts + search/filters
 * - GET /api/admin/leads?id=123   -> Single lead detail
 * - GET /api/admin/leads?export=csv -> UTF-8 BOM CSV export of current filtered leads
 * - PATCH /api/admin/leads        -> Update lead status & internal notes
 *
 * Security:
 * - Server-side ADMIN_ACCESS_KEY authentication (Bearer or X-Admin-Key) with SHA-256 timing-safe compare
 * - Per-IP brute-force lockout jail
 * - 100% parameterized D1 SQL queries (zero string concatenation of user input)
 * - Strict status allowlist: NEW, CONTACTED, CONFIRMED, ATTENDED, NO_SHOW
 * - No-store cache headers & nosniff
 */

import { recordIpFailure, logSecurityEvent, sanitizeField } from '../_security.js';

const ADMIN_FAILURES = new Map();
const JAIL_THRESHOLD = 4;
const JAIL_DURATION_MS = 10 * 60 * 1000;

export const VALID_STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW'];
export const SUPPORTED_PROGRAMS = [
  'CAFE_TALK_2026_11_14',
  'AI_FOUNDATION_2026_11_18',
  'AI_BUILDER_2026_11_21',
];

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

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
  if (rec.count >= JAIL_THRESHOLD) {
    rec.jailUntil = now + JAIL_DURATION_MS;
  }
  ADMIN_FAILURES.set(clientIp, rec);
}

async function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const hashA = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(a)));
  const hashB = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(b)));
  let diff = 0;
  for (let i = 0; i < hashA.length; i++) {
    diff |= hashA[i] ^ hashB[i];
  }
  return diff === 0;
}

function sanitizeMultilineNotes(val, maxLen = 2000) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/\r\n/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen);
}

async function authenticateAdmin(request, env, clientIp, headers) {
  const jailStatus = checkAdminJail(clientIp);
  if (jailStatus.jailed) {
    logSecurityEvent({
      action: 'admin_ip_jailed',
      clientIp,
      status: 429,
      reasons: ['admin_brute_force_lockout'],
    });
    return {
      ok: false,
      response: new Response(JSON.stringify({ success: false, error: jailStatus.error }), {
        status: 429,
        headers: { ...headers, 'Retry-After': String(jailStatus.retrySec) },
      }),
    };
  }

  const configuredKey = (env.ADMIN_ACCESS_KEY || '').trim();
  if (!configuredKey) {
    logSecurityEvent({
      action: 'admin_key_not_configured',
      clientIp,
      status: 503,
      reasons: ['ADMIN_ACCESS_KEY_missing_in_env'],
    });
    return {
      ok: false,
      response: new Response(JSON.stringify({
        success: false,
        error: 'Hệ thống quản trị chưa được cấu hình khóa truy cập (ADMIN_ACCESS_KEY) trên máy chủ Cloudflare.',
      }), { status: 503, headers }),
    };
  }

  const authHeader = request.headers.get('authorization') || '';
  const providedKey = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (request.headers.get('x-admin-key') || '').trim();

  if (!providedKey) {
    recordAdminFailure(clientIp);
    recordIpFailure(clientIp);
    return {
      ok: false,
      response: new Response(JSON.stringify({
        success: false,
        error: 'Yêu cầu xác thực quản trị viên.',
      }), { status: 401, headers }),
    };
  }

  const isValid = await timingSafeEqual(providedKey, configuredKey);
  if (!isValid) {
    recordAdminFailure(clientIp);
    recordIpFailure(clientIp);
    logSecurityEvent({
      action: 'admin_auth_failed',
      clientIp,
      status: 401,
      reasons: ['invalid_admin_key'],
    });
    return {
      ok: false,
      response: new Response(JSON.stringify({
        success: false,
        error: 'Khóa truy cập không hợp lệ. Vui lòng kiểm tra lại.',
      }), { status: 401, headers }),
    };
  }

  if (!env.DB) {
    return {
      ok: false,
      response: new Response(JSON.stringify({
        success: false,
        error: 'Cơ sở dữ liệu D1 chưa sẵn sàng.',
      }), { status: 503, headers }),
    };
  }

  return { ok: true };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const clientIp = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   '127.0.0.1';

  try {
    const auth = await authenticateAdmin(request, env, clientIp, headers);
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    // ─── 1. SINGLE LEAD DETAIL ───────────────────────────────────────────
    if (idParam !== null && idParam !== '') {
      const leadId = parseInt(idParam, 10);
      if (!Number.isInteger(leadId) || leadId <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Mã lead không hợp lệ.',
        }), { status: 400, headers });
      }

      const row = await env.DB.prepare(`
        SELECT * FROM leads WHERE id = ? LIMIT 1
      `).bind(leadId).first();

      if (!row) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Không tìm thấy thông tin lead.',
        }), { status: 404, headers });
      }

      return new Response(JSON.stringify({
        success: true,
        item: formatLeadRow(row),
      }), { status: 200, headers });
    }

    // ─── 2. FILTERS & SEARCH PARAMS ──────────────────────────────────────
    const rawProgram = sanitizeField(url.searchParams.get('program') || 'CAFE_TALK_2026_11_14', 64).toUpperCase();
    const rawStatus = sanitizeField(url.searchParams.get('status') || '', 32).toUpperCase();
    const rawSource = sanitizeField(url.searchParams.get('source') || '', 120);
    const rawDate = sanitizeField(url.searchParams.get('date') || '', 32);
    const rawFrom = sanitizeField(url.searchParams.get('from') || url.searchParams.get('date_from') || '', 32);
    const rawTo = sanitizeField(url.searchParams.get('to') || url.searchParams.get('date_to') || '', 32);
    const search = sanitizeField(url.searchParams.get('search') || url.searchParams.get('q') || '', 120);
    const wantsCsv = url.searchParams.get('export') === 'csv' || url.searchParams.get('format') === 'csv';

    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10) || 25));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);

    const where = [];
    const params = [];

    // Program filter
    if (rawProgram && rawProgram !== 'ALL') {
      where.push('program = ?');
      params.push(rawProgram);
    }

    // Status filter
    if (rawStatus && rawStatus !== 'ALL' && VALID_STATUSES.includes(rawStatus)) {
      if (rawStatus === 'NEW') {
        where.push("(status = 'NEW' OR status IS NULL OR status = '')");
      } else {
        where.push('status = ?');
        params.push(rawStatus);
      }
    }

    // Source filter
    if (rawSource && rawSource !== 'ALL') {
      where.push('source = ?');
      params.push(rawSource);
    }

    // Date filter
    if (rawDate && DATE_ONLY_RE.test(rawDate)) {
      where.push('substr(created_at, 1, 10) = ?');
      params.push(rawDate);
    } else {
      if (rawFrom) {
        if (DATE_ONLY_RE.test(rawFrom)) {
          where.push('substr(created_at, 1, 10) >= ?');
          params.push(rawFrom);
        } else if (ISO_INSTANT_RE.test(rawFrom)) {
          where.push('created_at >= ?');
          params.push(rawFrom);
        }
      }
      if (rawTo) {
        if (DATE_ONLY_RE.test(rawTo)) {
          where.push('substr(created_at, 1, 10) <= ?');
          params.push(rawTo);
        } else if (ISO_INSTANT_RE.test(rawTo)) {
          where.push('created_at <= ?');
          params.push(rawTo);
        }
      }
    }

    // Free-text search: full_name, name, phone, email, company, job_title, other_source
    if (search) {
      const like = '%' + search.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
      where.push(`(
        full_name LIKE ? ESCAPE '\\' OR
        name LIKE ? ESCAPE '\\' OR
        phone LIKE ? ESCAPE '\\' OR
        email LIKE ? ESCAPE '\\' OR
        company LIKE ? ESCAPE '\\' OR
        job_title LIKE ? ESCAPE '\\' OR
        other_source LIKE ? ESCAPE '\\'
      )`);
      params.push(like, like, like, like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // ─── 3. CSV EXPORT ───────────────────────────────────────────────────
    if (wantsCsv) {
      const csvRows = await env.DB.prepare(`
        SELECT * FROM leads
        ${whereSql}
        ORDER BY created_at DESC, id DESC
        LIMIT 5000
      `).bind(...params).all();

      const items = (csvRows.results || []).map(formatLeadRow);
      const csvContent = toLeadsCsv(items);
      const progSlug = (rawProgram || 'all').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const dateSlug = new Date().toISOString().slice(0, 10);

      return new Response('\uFEFF' + csvContent, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="go4ai-leads-${progSlug}-${dateSlug}.csv"`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // ─── 4. SUMMARY COUNTS (scoped to selected program) ──────────────────
    const summaryWhere = [];
    const summaryParams = [];
    if (rawProgram && rawProgram !== 'ALL') {
      summaryWhere.push('program = ?');
      summaryParams.push(rawProgram);
    }
    const summaryWhereSql = summaryWhere.length ? `WHERE ${summaryWhere.join(' AND ')}` : '';

    const summaryRow = await env.DB.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN COALESCE(NULLIF(status, ''), 'NEW') = 'NEW' THEN 1 ELSE 0 END) AS new_count,
        SUM(CASE WHEN status = 'CONTACTED' THEN 1 ELSE 0 END) AS contacted_count,
        SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN status = 'ATTENDED' THEN 1 ELSE 0 END) AS attended_count,
        SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) AS no_show_count
      FROM leads
      ${summaryWhereSql}
    `).bind(...summaryParams).first();

    // Distinct sources for the filter dropdown
    const sourcesRes = await env.DB.prepare(`
      SELECT DISTINCT source FROM leads
      ${summaryWhereSql}
      ORDER BY source ASC
      LIMIT 100
    `).bind(...summaryParams).all();

    const sources = (sourcesRes.results || [])
      .map((r) => r.source)
      .filter((s) => typeof s === 'string' && s.trim() !== '');

    // ─── 5. PAGINATED LEAD LIST ──────────────────────────────────────────
    const countRes = await env.DB.prepare(`
      SELECT COUNT(*) AS total FROM leads ${whereSql}
    `).bind(...params).first();

    const listRes = await env.DB.prepare(`
      SELECT * FROM leads
      ${whereSql}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    return new Response(JSON.stringify({
      success: true,
      program: rawProgram || 'ALL',
      summary: {
        total: Number(summaryRow?.total || 0),
        NEW: Number(summaryRow?.new_count || 0),
        CONTACTED: Number(summaryRow?.contacted_count || 0),
        CONFIRMED: Number(summaryRow?.confirmed_count || 0),
        ATTENDED: Number(summaryRow?.attended_count || 0),
        NO_SHOW: Number(summaryRow?.no_show_count || 0),
      },
      sources,
      total: Number(countRes?.total || 0),
      limit,
      offset,
      items: (listRes.results || []).map(formatLeadRow),
    }), { status: 200, headers });

  } catch (err) {
    console.error('[admin-leads] GET error:', err.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Lỗi truy xuất dữ liệu quản trị.',
    }), { status: 500, headers });
  }
}

export async function onRequestPatch(context) {
  return handleLeadUpdate(context);
}

export async function onRequestPost(context) {
  return handleLeadUpdate(context);
}

async function handleLeadUpdate(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const clientIp = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   '127.0.0.1';

  try {
    const auth = await authenticateAdmin(request, env, clientIp, headers);
    if (!auth.ok) return auth.response;

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: 'Định dạng JSON không hợp lệ.',
      }), { status: 400, headers });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Dữ liệu cập nhật không hợp lệ.',
      }), { status: 400, headers });
    }

    const leadId = parseInt(body.id, 10);
    if (!Number.isInteger(leadId) || leadId <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Mã lead (id) không hợp lệ.',
      }), { status: 422, headers });
    }

    const existing = await env.DB.prepare(`
      SELECT * FROM leads WHERE id = ? LIMIT 1
    `).bind(leadId).first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Không tìm thấy bản ghi lead cần cập nhật.',
      }), { status: 404, headers });
    }

    let nextStatus = existing.status || 'NEW';
    if (body.status !== undefined) {
      const candidateStatus = String(body.status || '').trim().toUpperCase();
      if (!VALID_STATUSES.includes(candidateStatus)) {
        return new Response(JSON.stringify({
          success: false,
          error: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${VALID_STATUSES.join(', ')}.`,
        }), { status: 422, headers });
      }
      nextStatus = candidateStatus;
    }

    let nextNotes = existing.notes || '';
    if (body.notes !== undefined) {
      nextNotes = sanitizeMultilineNotes(body.notes, 2000);
    }

    const updatedAt = new Date().toISOString();

    await env.DB.prepare(`
      UPDATE leads
      SET status = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(nextStatus, nextNotes, updatedAt, leadId).run();

    const updatedRow = await env.DB.prepare(`
      SELECT * FROM leads WHERE id = ? LIMIT 1
    `).bind(leadId).first();

    return new Response(JSON.stringify({
      success: true,
      message: 'Đã lưu cập nhật thành công.',
      item: formatLeadRow(updatedRow),
    }), { status: 200, headers });

  } catch (err) {
    console.error('[admin-leads] UPDATE error:', err.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Không thể cập nhật lead lúc này.',
    }), { status: 500, headers });
  }
}

export async function onRequestOptions(context) {
  const headers = getCorsHeaders(context.request);
  headers['Access-Control-Max-Age'] = '86400';
  return new Response(null, { status: 204, headers });
}

export async function onRequestDelete(context) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Phương thức không được phép.',
  }), { status: 405, headers: getCorsHeaders(context.request) });
}

function parseJsonSafe(raw) {
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function formatLeadRow(row) {
  const extra = parseJsonSafe(row.payload_json);
  const fullName = row.full_name || row.name || extra.full_name || '';
  const jobTitle = row.job_title || row.role || extra.job_title || '';
  const interest = row.interest || extra.interest || '';
  const otherSource = row.other_source || extra.other_source || '';
  const status = VALID_STATUSES.includes((row.status || '').toUpperCase())
    ? row.status.toUpperCase()
    : 'NEW';
  const privacyConsent = row.privacy_consent === 1 || row.privacy_consent === true || extra.privacy_consent === true;
  const marketingConsent = row.marketing_consent === 1 || row.marketing_consent === true || extra.marketing_consent === true;

  return {
    id: row.id,
    program: row.program || extra.program || row.lead_type || '',
    lead_type: row.lead_type || '',
    created_at: row.created_at || '',
    updated_at: row.updated_at || row.created_at || '',
    full_name: fullName,
    phone: row.phone || '',
    email: row.email || '',
    company: row.company || '',
    job_title: jobTitle,
    interest: Array.isArray(interest) ? interest.join(', ') : String(interest || ''),
    source: row.source || '',
    other_source: otherSource,
    privacy_consent: Boolean(privacyConsent),
    privacy_consent_at: row.privacy_consent_at || extra.privacy_consent_at || row.created_at || '',
    privacy_policy_version: row.privacy_policy_version || extra.privacy_policy_version || '',
    marketing_consent: Boolean(marketingConsent),
    status,
    notes: row.notes || '',
    utm_source: row.utm_source || extra.utm_source || '',
    utm_medium: row.utm_medium || extra.utm_medium || '',
    utm_campaign: row.utm_campaign || extra.utm_campaign || '',
    utm_content: row.utm_content || extra.utm_content || '',
    utm_term: row.utm_term || extra.utm_term || '',
    referrer: row.referrer || extra.referrer || '',
    landing_path: row.landing_path || row.source_page || extra.landing_path || '',
  };
}

function csvCell(value) {
  let s = value === null || value === undefined ? '' : String(value);
  // Prevent CSV formula injection in spreadsheet tools
  if (/^[=+\-@]/.test(s) && !/^\+?\d[\d\s.-]*$/.test(s)) {
    s = "'" + s;
  }
  return '"' + s.replace(/"/g, '""') + '"';
}

function toLeadsCsv(items) {
  const head = [
    'ID',
    'Program',
    'Created At',
    'Full Name',
    'Phone / Zalo',
    'Email',
    'Company',
    'Job Title',
    'Interest',
    'Source',
    'Other Source',
    'Privacy Consent',
    'Privacy Consent At',
    'Privacy Policy Version',
    'Marketing Consent',
    'Status',
    'Notes',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'UTM Content',
    'UTM Term',
    'Referrer',
    'Landing Path',
  ];
  const lines = [head.map(csvCell).join(',')];
  for (const it of items) {
    lines.push([
      it.id,
      it.program,
      it.created_at,
      it.full_name,
      it.phone,
      it.email,
      it.company,
      it.job_title,
      it.interest,
      it.source,
      it.other_source,
      it.privacy_consent ? 'TRUE' : 'FALSE',
      it.privacy_consent_at,
      it.privacy_policy_version,
      it.marketing_consent ? 'TRUE' : 'FALSE',
      it.status,
      it.notes,
      it.utm_source,
      it.utm_medium,
      it.utm_campaign,
      it.utm_content,
      it.utm_term,
      it.referrer,
      it.landing_path,
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
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
  };
}
