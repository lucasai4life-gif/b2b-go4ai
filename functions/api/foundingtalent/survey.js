/**
 * POST /api/foundingtalent/survey
 * Public endpoint — stores one completed GO4AI | Founding Talent Survey response.
 *
 * Contract (survey page is the only caller):
 *   { submission_id, q1, q1_other, q2_text, q3[], q3_other, q4[],
 *     q5, q5_other, q6[], q6_other, q7_text,
 *     source, page_path, utm_source, utm_campaign, referrer }
 *
 * Security:
 * - Request header / 32KB body hardening (shared engine)
 * - IP burst + jail rate limiting (shared engine)
 * - Prototype pollution rejection
 * - Whitelisted option codes, strict lengths, sanitized free text
 * - Parameterized D1 queries (no string-built SQL)
 * - Idempotent: submission_id is UNIQUE, a repeat POST is a no-op
 * - No scoring, no ranking, no pass/fail
 * - Safe error responses (never leak SQL / stack)
 */

import {
  checkRequestHeaders,
  sanitizeField,
  checkIpRateLimit,
  recordIpFailure,
  logSecurityEvent,
} from '../_security.js';

// ─── OPTION WHITELISTS ────────────────────────────────────────────────────
const Q1_CODES = ['A', 'B', 'C', 'D', 'E', 'F'];
const Q3_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const Q4_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const Q5_CODES = ['A', 'B', 'C', 'D', 'E'];
const Q6_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Q3 exclusive options: "no real barrier" / "not enough experience yet"
const Q3_EXCLUSIVE = ['H', 'I'];

const MIN_TEXT = 10;
const MAX_TEXT = 4000;

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

function normalizeCode(raw, allowed) {
  const code = sanitizeField(raw, 4).toUpperCase();
  return allowed.includes(code) ? code : '';
}

function normalizeList(raw, allowed, max) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    const code = normalizeCode(item, allowed);
    if (code && !out.includes(code)) out.push(code);
    if (out.length >= max) break;
  }
  return out;
}

function normalizeText(raw, max = MAX_TEXT) {
  return sanitizeField(raw, max);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const clientIp = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   '127.0.0.1';

  try {
    // ─── 1. HEADER / BODY HARDENING ─────────────────────────────────────
    const headerCheck = checkRequestHeaders(request);
    if (!headerCheck.ok) {
      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'fts_header_check_failed',
        clientIp,
        status: headerCheck.status,
        reasons: [headerCheck.error],
      });
      return jsonResponse({ success: false, error: headerCheck.error }, headerCheck.status, headers);
    }

    // ─── 2. RATE LIMIT ──────────────────────────────────────────────────
    const rateCheck = checkIpRateLimit(clientIp);
    if (!rateCheck.allowed) {
      logSecurityEvent({
        action: 'fts_rate_limited',
        clientIp,
        status: 429,
        reasons: ['ip_burst_or_jail_limit_exceeded'],
      });
      return jsonResponse(
        { success: false, error: rateCheck.error },
        429,
        { ...headers, 'Retry-After': String(rateCheck.retryAfter || 60) }
      );
    }

    // ─── 3. PARSE BODY ──────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      recordIpFailure(clientIp);
      return jsonResponse({ success: false, error: 'Định dạng JSON không hợp lệ.' }, 400, headers);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      recordIpFailure(clientIp);
      return jsonResponse({ success: false, error: 'Dữ liệu gửi lên không đúng định dạng.' }, 400, headers);
    }

    if (Object.prototype.hasOwnProperty.call(body, '__proto__') ||
        Object.prototype.hasOwnProperty.call(body, 'constructor') ||
        Object.prototype.hasOwnProperty.call(body, 'prototype')) {
      recordIpFailure(clientIp);
      return jsonResponse({ success: false, error: 'Yêu cầu không hợp lệ.' }, 400, headers);
    }

    // ─── 4. VALIDATE ANSWERS ────────────────────────────────────────────
    const q1 = normalizeCode(body.q1, Q1_CODES);
    if (!q1) {
      return jsonResponse({ success: false, error: 'Câu 1: vui lòng chọn một đáp án.' }, 422, headers);
    }

    const q1Other = q1 === 'F' ? normalizeText(body.q1_other, 500) : '';
    if (q1 === 'F' && q1Other.length < 2) {
      return jsonResponse({ success: false, error: 'Câu 1: vui lòng nhập nội dung cho lựa chọn "Khác".' }, 422, headers);
    }

    const q2Text = normalizeText(body.q2_text);
    if (q2Text.length < MIN_TEXT) {
      return jsonResponse({ success: false, error: 'Câu 2: vui lòng chia sẻ câu trả lời của bạn.' }, 422, headers);
    }

    const q3 = normalizeList(body.q3, Q3_CODES, 2);
    if (q3.length === 0) {
      return jsonResponse({ success: false, error: 'Câu 3: vui lòng chọn tối đa 2 đáp án.' }, 422, headers);
    }
    if (q3.some(c => Q3_EXCLUSIVE.includes(c)) && q3.length > 1) {
      return jsonResponse({ success: false, error: 'Câu 3: lựa chọn H và I không thể kết hợp với đáp án khác.' }, 422, headers);
    }
    const q3Other = q3.includes('J') ? normalizeText(body.q3_other, 500) : '';
    if (q3.includes('J') && q3Other.length < 2) {
      return jsonResponse({ success: false, error: 'Câu 3: vui lòng nhập nội dung cho lựa chọn "Khác".' }, 422, headers);
    }

    const q4 = normalizeList(body.q4, Q4_CODES, 2);
    if (q4.length === 0) {
      return jsonResponse({ success: false, error: 'Câu 4: vui lòng chọn tối đa 2 đáp án.' }, 422, headers);
    }

    const q5 = normalizeCode(body.q5, Q5_CODES);
    if (!q5) {
      return jsonResponse({ success: false, error: 'Câu 5: vui lòng chọn một đáp án.' }, 422, headers);
    }
    const q5Other = q5 === 'E' ? normalizeText(body.q5_other, 500) : '';
    if (q5 === 'E' && q5Other.length < 2) {
      return jsonResponse({ success: false, error: 'Câu 5: vui lòng nhập nội dung cho lựa chọn "Khác".' }, 422, headers);
    }

    const q6 = normalizeList(body.q6, Q6_CODES, 2);
    if (q6.length === 0) {
      return jsonResponse({ success: false, error: 'Câu 6: vui lòng chọn tối đa 2 đáp án.' }, 422, headers);
    }
    const q6Other = q6.includes('H') ? normalizeText(body.q6_other, 500) : '';
    if (q6.includes('H') && q6Other.length < 2) {
      return jsonResponse({ success: false, error: 'Câu 6: vui lòng nhập nội dung cho lựa chọn "Khác".' }, 422, headers);
    }

    const q7Text = normalizeText(body.q7_text);
    if (q7Text.length < MIN_TEXT) {
      return jsonResponse({ success: false, error: 'Câu 7: vui lòng chia sẻ câu trả lời của bạn.' }, 422, headers);
    }

    // ─── 5. METADATA ────────────────────────────────────────────────────
    let submissionId = sanitizeField(body.submission_id || '', 64);
    if (submissionId && !/^fts_[a-z0-9_]{4,40}$/.test(submissionId)) {
      return jsonResponse({ success: false, error: 'Mã phiếu không hợp lệ.' }, 422, headers);
    }
    if (!submissionId) {
      submissionId = `fts_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
    }

    const source = sanitizeField(body.source || 'foundingtalent-survey', 64) || 'foundingtalent-survey';
    const pagePath = sanitizeField(body.page_path || '/foundingtalent-survey', 255);
    const utmSource = sanitizeField(body.utm_source || '', 100);
    const utmCampaign = sanitizeField(body.utm_campaign || '', 100);
    const referrer = sanitizeField(body.referrer || '', 500);

    if (!env.DB) {
      return jsonResponse({ success: false, error: 'Dịch vụ lưu trữ tạm thời không sẵn sàng.' }, 503, headers);
    }

    // ─── 6. IDEMPOTENT INSERT ───────────────────────────────────────────
    const nowIso = new Date().toISOString();
    const q3Json = JSON.stringify(q3);
    const q4Json = JSON.stringify(q4);
    const q6Json = JSON.stringify(q6);

    const result = await env.DB.prepare(`
      INSERT INTO founding_talent_surveys (
        submission_id, created_at, updated_at,
        q1_answer, q1_other, q2_text,
        q3_answers_json, q3_other, q4_answers_json,
        q5_answer, q5_other, q6_answers_json, q6_other, q7_text,
        source, page_path, utm_source, utm_campaign, referrer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(submission_id) DO NOTHING
    `).bind(
      submissionId, nowIso, nowIso,
      q1, q1Other || null, q2Text,
      q3Json, q3Other || null, q4Json,
      q5, q5Other || null, q6Json, q6Other || null, q7Text,
      source, pagePath || null, utmSource || null, utmCampaign || null, referrer || null
    ).run();

    const changed = result?.meta?.changes ?? 0;

    return jsonResponse({
      success: true,
      submission_id: submissionId,
      duplicate: changed === 0,
    }, changed === 0 ? 200 : 201, headers);

  } catch (err) {
    console.error('[fts] submit error:', err.message);
    return jsonResponse({
      success: false,
      error: 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.',
    }, 500, headers);
  }
}

// ─── OPTIONS PREFLIGHT ───────────────────────────────────────────────────
export async function onRequestOptions(context) {
  const headers = getCorsHeaders(context.request);
  headers['Access-Control-Max-Age'] = '86400';
  return new Response(null, { status: 204, headers });
}

// ─── REJECT GET ──────────────────────────────────────────────────────────
export async function onRequestGet(context) {
  return jsonResponse(
    { success: false, error: 'Phương thức không được hỗ trợ. Vui lòng sử dụng POST.' },
    405,
    getCorsHeaders(context.request)
  );
}

// ─── CORS ────────────────────────────────────────────────────────────────
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
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
