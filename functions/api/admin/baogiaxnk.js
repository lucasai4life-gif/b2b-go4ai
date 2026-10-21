/**
 * GET /api/admin/baogiaxnk
 * Protected internal admin endpoint for /baogiaxnk surveys and leads.
 *
 * Security:
 * - Read-only (GET, OPTIONS only; rejects mutations)
 * - Protected by server-side ADMIN_ACCESS_KEY
 * - Timing-safe constant-time authentication comparison
 * - Brute-force IP failure tracking and lockout
 * - Parameterized D1 SQLite queries (SQL injection proof)
 * - Safe response formatting (no raw SQL errors or internal secrets)
 * - No-store cache control headers (prevents browser/CDN caching of customer data)
 */

import {
  recordIpFailure,
  logSecurityEvent,
  sanitizeField
} from '../_security.js';

// In-memory brute-force jail tracking for admin endpoint
const ADMIN_FAILURES = new Map(); // ip -> { count: number, windowStart: number, jailUntil: number }
const JAIL_THRESHOLD = 4;
const JAIL_DURATION_MS = 10 * 60 * 1000; // 10 minutes

function checkAdminJail(clientIp) {
  const now = Date.now();
  const rec = ADMIN_FAILURES.get(clientIp);
  if (rec && rec.jailUntil && now < rec.jailUntil) {
    const retrySec = Math.ceil((rec.jailUntil - now) / 1000);
    return {
      jailed: true,
      retrySec,
      error: `Địa chỉ IP của bạn tạm thời bị khóa do nhiều lần đăng nhập không thành công. Vui lòng thử lại sau ${retrySec} giây.`
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

function clearAdminFailure(clientIp) {
  ADMIN_FAILURES.delete(clientIp);
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

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const clientIp = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   '127.0.0.1';

  try {
    // ─── 1. JAIL CHECK ────────────────────────────────────────────────
    const jailStatus = checkAdminJail(clientIp);
    if (jailStatus.jailed) {
      logSecurityEvent({
        action: 'admin_ip_jailed',
        clientIp,
        status: 429,
        reasons: ['admin_brute_force_lockout']
      });
      return new Response(JSON.stringify({
        success: false,
        error: jailStatus.error
      }), {
        status: 429,
        headers: { ...headers, 'Retry-After': String(jailStatus.retrySec) }
      });
    }

    // ─── 2. AUTHENTICATION CHECK ──────────────────────────────────────
    const configuredKey = (env.ADMIN_ACCESS_KEY || '').trim();
    if (!configuredKey) {
      logSecurityEvent({
        action: 'admin_key_not_configured',
        clientIp,
        status: 503,
        reasons: ['ADMIN_ACCESS_KEY_missing_in_env']
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Hệ thống quản trị chưa được cấu hình khóa truy cập (ADMIN_ACCESS_KEY) trên máy chủ Cloudflare.'
      }), {
        status: 503,
        headers
      });
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
        error: 'Yêu cầu khóa truy cập quản trị.'
      }), {
        status: 401,
        headers
      });
    }

    const isMatch = await timingSafeEqual(providedKey, configuredKey);
    if (!isMatch) {
      recordAdminFailure(clientIp);
      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'admin_auth_failed',
        clientIp,
        status: 401,
        reasons: ['invalid_admin_key']
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Khóa truy cập không hợp lệ. Vui lòng kiểm tra lại.'
      }), {
        status: 401,
        headers
      });
    }

    // Auth succeeded: clear failures for this IP
    clearAdminFailure(clientIp);

    // ─── 3. QUERY D1 DATABASE ─────────────────────────────────────────
    if (!env.DB) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cơ sở dữ liệu D1 chưa sẵn sàng.'
      }), {
        status: 503,
        headers
      });
    }

    const url = new URL(request.url);
    const submissionIdParam = sanitizeField(url.searchParams.get('submission_id') || '', 64);
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || '250', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    // Single item detail lookup
    if (submissionIdParam) {
      const row = await env.DB.prepare(`
        SELECT 
          s.id,
          s.submission_id,
          s.created_at,
          s.updated_at,
          s.revision,
          s.source,
          s.event_id,
          s.sector,
          s.sector_name,
          s.answers_json,
          s.score_p,
          s.score_f,
          s.score_n,
          s.route,
          s.caveat,
          s.result_title,
          s.result_subtitle,
          s.first_action,
          s.stages_json,
          s.seven_days_json,
          s.utm_source,
          s.utm_campaign,
          s.qr_variant,
          s.current_page_path,
          s.client_ip,
          s.user_agent,
          s.lead_id,
          l.name as lead_name,
          l.phone as lead_phone,
          l.company as lead_company,
          l.role as lead_role,
          l.email as lead_email,
          l.payload_json as lead_payload_json,
          l.created_at as lead_created_at
        FROM baogiaxnk_surveys s
        LEFT JOIN leads l ON (s.lead_id = l.id OR json_extract(l.payload_json, '$.submission_id') = s.submission_id)
        WHERE s.submission_id = ?
        LIMIT 1
      `).bind(submissionIdParam).first();

      if (!row) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Không tìm thấy bản ghi khảo sát.'
        }), {
          status: 404,
          headers
        });
      }

      return new Response(JSON.stringify({
        success: true,
        item: formatSurveyRow(row)
      }), {
        status: 200,
        headers
      });
    }

    // List query
    const countRes = await env.DB.prepare(`SELECT COUNT(*) as total FROM baogiaxnk_surveys`).first();
    const total = countRes?.total || 0;

    const rows = await env.DB.prepare(`
      SELECT 
        s.id,
        s.submission_id,
        s.created_at,
        s.updated_at,
        s.revision,
        s.source,
        s.event_id,
        s.sector,
        s.sector_name,
        s.answers_json,
        s.score_p,
        s.score_f,
        s.score_n,
        s.route,
        s.caveat,
        s.result_title,
        s.result_subtitle,
        s.first_action,
        s.stages_json,
        s.seven_days_json,
        s.utm_source,
        s.utm_campaign,
        s.qr_variant,
        s.current_page_path,
        s.client_ip,
        s.user_agent,
        s.lead_id,
        l.name as lead_name,
        l.phone as lead_phone,
        l.company as lead_company,
        l.role as lead_role,
        l.email as lead_email,
        l.payload_json as lead_payload_json,
        l.created_at as lead_created_at
      FROM baogiaxnk_surveys s
      LEFT JOIN leads l ON (s.lead_id = l.id OR json_extract(l.payload_json, '$.submission_id') = s.submission_id)
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const items = (rows.results || []).map(formatSurveyRow);

    return new Response(JSON.stringify({
      success: true,
      total,
      limit,
      offset,
      items
    }), {
      status: 200,
      headers
    });

  } catch (err) {
    console.error('[admin-baogiaxnk] Query error:', err.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Lỗi truy xuất cơ sở dữ liệu.'
    }), {
      status: 500,
      headers
    });
  }
}

// ─── OPTIONS PREFLIGHT ───────────────────────────────────────────────────
export async function onRequestOptions(context) {
  const headers = getCorsHeaders(context.request);
  headers['Access-Control-Max-Age'] = '86400';
  return new Response(null, {
    status: 204,
    headers
  });
}

// ─── REJECT MUTATING METHODS (READ-ONLY) ──────────────────────────────────
export async function onRequestPost(context) { return methodNotAllowed(context.request); }
export async function onRequestPut(context) { return methodNotAllowed(context.request); }
export async function onRequestDelete(context) { return methodNotAllowed(context.request); }

function methodNotAllowed(request) {
  const headers = getCorsHeaders(request);
  return new Response(JSON.stringify({
    success: false,
    error: 'Chế độ chỉ đọc (Read-only). Không hỗ trợ phương thức này.'
  }), {
    status: 405,
    headers
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
function formatSurveyRow(row) {
  let answers = [];
  try {
    answers = JSON.parse(row.answers_json || '[]');
  } catch {}

  let stages = [];
  try {
    stages = JSON.parse(row.stages_json || '[]');
  } catch {}

  let sevenDays = [];
  try {
    sevenDays = JSON.parse(row.seven_days_json || '[]');
  } catch {}

  let leadPayload = {};
  try {
    leadPayload = JSON.parse(row.lead_payload_json || '{}');
  } catch {}

  const contact = leadPayload.contact || {};
  const requests = leadPayload.requests || {};

  const name = row.lead_name || contact.name || '';
  const phone = row.lead_phone || contact.phone || '';
  const company = row.lead_company || contact.company || '';
  const role = row.lead_role || contact.role || '';
  const email = row.lead_email || contact.email || '';
  const preferredTime = contact.preferred_contact_time || '';
  const note = contact.message || leadPayload.message || '';
  const hasContact = Boolean(name || phone || email || company || row.lead_id);

  return {
    id: row.id,
    submission_id: row.submission_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    revision: row.revision || 1,
    source: row.source,
    event_id: row.event_id,
    sector: row.sector,
    sector_name: row.sector_name,
    answers,
    scores: {
      P: row.score_p ?? 0,
      F: row.score_f ?? 0,
      N: row.score_n ?? 0
    },
    route: row.route,
    caveat: row.caveat || '',
    result: {
      title: row.result_title || '',
      subtitle: row.result_subtitle || '',
      action: row.first_action || '',
      stages,
      days: sevenDays
    },
    metadata: {
      utm_source: row.utm_source || '',
      utm_campaign: row.utm_campaign || '',
      qr_variant: row.qr_variant || '',
      current_page_path: row.current_page_path || '/baogiaxnk',
      client_ip: row.client_ip || '',
      user_agent: row.user_agent || ''
    },
    lead_id: row.lead_id || null,
    has_contact: hasContact,
    contact: {
      name,
      phone,
      company,
      role,
      email,
      preferred_contact_time: preferredTime,
      note,
      diagnostic_60min: Boolean(requests.diagnostic_60min),
      seven_day_plan: Boolean(requests.seven_day_plan),
      lead_created_at: row.lead_created_at || null
    }
  };
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
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key'
  };
}
