/**
 * POST /api/baogiaxnk/survey
 * Auto-save diagnostic survey to Cloudflare D1 when result appears.
 *
 * Security:
 * - Request headers & size checks (max 32KB)
 * - IP burst & jail rate limiting
 * - Prototype pollution check
 * - Input sanitization & strict validation
 * - Parameterized D1 queries (SQL injection proof)
 * - Safe error responses (no raw stack/SQL leaks)
 * - Idempotency & revision support (updates existing record when submission_id is provided)
 */

import {
  checkRequestHeaders,
  sanitizeField,
  checkIpRateLimit,
  recordIpFailure,
  logSecurityEvent,
} from '../_security.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const clientIp = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   '127.0.0.1';
  const userAgent = sanitizeField(request.headers.get('user-agent') || '', 255);

  try {
    // ─── 1. REQUEST HEADERS & SIZE HARDENING ──────────────────────────
    const headerCheck = checkRequestHeaders(request);
    if (!headerCheck.ok) {
      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'survey_header_check_failed',
        clientIp,
        status: headerCheck.status,
        reasons: [headerCheck.error],
      });
      return new Response(JSON.stringify({ success: false, error: headerCheck.error }), {
        status: headerCheck.status,
        headers,
      });
    }

    // ─── 2. IN-MEMORY RATE LIMITING (Burst & Jail) ────────────────────
    const rateCheck = checkIpRateLimit(clientIp);
    if (!rateCheck.allowed) {
      logSecurityEvent({
        action: 'survey_rate_limited',
        clientIp,
        status: 429,
        reasons: ['ip_burst_or_jail_limit_exceeded'],
      });
      const resHeaders = { ...headers, 'Retry-After': String(rateCheck.retryAfter || 60) };
      return new Response(JSON.stringify({ success: false, error: rateCheck.error }), {
        status: 429,
        headers: resHeaders,
      });
    }

    // ─── 3. PARSE JSON BODY ───────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({ success: false, error: 'Định dạng JSON không hợp lệ.' }), {
        status: 400,
        headers,
      });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({ success: false, error: 'Dữ liệu gửi lên không đúng định dạng.' }), {
        status: 400,
        headers,
      });
    }

    if (Object.prototype.hasOwnProperty.call(body, '__proto__') || Object.prototype.hasOwnProperty.call(body, 'constructor')) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({ success: false, error: 'Yêu cầu không hợp lệ.' }), {
        status: 400,
        headers,
      });
    }

    // ─── 4. VALIDATE & SANITIZE SURVEY PAYLOAD ────────────────────────
    // Answers must be an array of length 9 with numeric values (0, 1, 2)
    if (!Array.isArray(body.answers) || body.answers.length !== 9) {
      return new Response(JSON.stringify({ success: false, error: 'Danh sách 9 câu trả lời là bắt buộc.' }), {
        status: 422,
        headers,
      });
    }
    const cleanAnswers = body.answers.map(v => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 0 && n <= 2 ? n : 0;
    });

    // Route must be one of 'A', 'B', 'C', 'D'
    const route = sanitizeField(body.route || '', 10).toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(route)) {
      return new Response(JSON.stringify({ success: false, error: 'Kết quả route không hợp lệ.' }), {
        status: 422,
        headers,
      });
    }

    // Scores
    const scores = (body.scores && typeof body.scores === 'object') ? body.scores : {};
    const scoreP = Math.max(0, Math.min(6, Number.isInteger(Number(scores.P)) ? Number(scores.P) : 0));
    const scoreF = Math.max(0, Math.min(6, Number.isInteger(Number(scores.F)) ? Number(scores.F) : 0));
    const scoreN = Math.max(0, Math.min(6, Number.isInteger(Number(scores.N)) ? Number(scores.N) : 0));

    // Sector & contextual strings
    const sector = sanitizeField(body.sector || '', 50);
    const sectorName = sanitizeField(body.sector_name || '', 100);
    const caveat = sanitizeField(body.caveat || '', 500);

    // Result content
    const resData = (body.result && typeof body.result === 'object') ? body.result : {};
    const resultTitle = sanitizeField(resData.title || '', 200);
    const resultSubtitle = sanitizeField(resData.subtitle || '', 500);
    const firstAction = sanitizeField(resData.action || body.first_action || '', 500);
    const stagesJson = Array.isArray(resData.stages) ? JSON.stringify(resData.stages) : null;
    const sevenDaysJson = Array.isArray(resData.days) ? JSON.stringify(resData.days) : null;

    // Metadata
    const meta = (body.metadata && typeof body.metadata === 'object') ? body.metadata : {};
    const source = sanitizeField(body.source || 'baogiaxnk', 64);
    const eventId = sanitizeField(body.event_id || 'coffee-for-business-2026-10-22', 100);
    const utmSource = sanitizeField(meta.utm_source || body.utm_source, 100);
    const utmCampaign = sanitizeField(meta.utm_campaign || body.utm_campaign, 100);
    const qrVariant = sanitizeField(meta.qr_variant || body.qr_variant, 50);
    const currentPagePath = sanitizeField(meta.current_page_path || body.current_page_path || '/baogiaxnk', 255);

    const submissionIdParam = sanitizeField(body.submission_id || '', 64);
    const nowIso = new Date().toISOString();

    if (!env.DB) {
      return new Response(JSON.stringify({ success: false, error: 'Database service unavailable' }), {
        status: 503,
        headers,
      });
    }

    // ─── 5. CHECK EXISTING SUBMISSION (REVISION/UPDATE) ───────────────
    if (submissionIdParam) {
      try {
        const existing = await env.DB.prepare(`
          SELECT id, submission_id, revision FROM baogiaxnk_surveys
          WHERE submission_id = ?
          LIMIT 1
        `).bind(submissionIdParam).first();

        if (existing) {
          const nextRevision = (existing.revision || 1) + 1;
          await env.DB.prepare(`
            UPDATE baogiaxnk_surveys SET
              sector = ?,
              sector_name = ?,
              answers_json = ?,
              score_p = ?,
              score_f = ?,
              score_n = ?,
              route = ?,
              caveat = ?,
              result_title = ?,
              result_subtitle = ?,
              first_action = ?,
              stages_json = ?,
              seven_days_json = ?,
              utm_source = ?,
              utm_campaign = ?,
              qr_variant = ?,
              current_page_path = ?,
              client_ip = ?,
              user_agent = ?,
              updated_at = ?,
              revision = ?
            WHERE submission_id = ?
          `).bind(
            sector || null,
            sectorName || null,
            JSON.stringify(cleanAnswers),
            scoreP,
            scoreF,
            scoreN,
            route,
            caveat || null,
            resultTitle || null,
            resultSubtitle || null,
            firstAction || null,
            stagesJson,
            sevenDaysJson,
            utmSource || null,
            utmCampaign || null,
            qrVariant || null,
            currentPagePath || null,
            clientIp,
            userAgent,
            nowIso,
            nextRevision,
            existing.submission_id
          ).run();

          return new Response(JSON.stringify({
            success: true,
            submission_id: existing.submission_id,
            revision: nextRevision,
            updated: true,
          }), {
            status: 200,
            headers,
          });
        }
      } catch (dbReadErr) {
        console.warn('[survey] Existing lookup warning:', dbReadErr.message);
      }
    }

    // ─── 6. CREATE NEW SUBMISSION ─────────────────────────────────────
    const newSubmissionId = `bgx_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;

    try {
      await env.DB.prepare(`
        INSERT INTO baogiaxnk_surveys (
          submission_id, created_at, updated_at, revision,
          source, event_id,
          sector, sector_name, answers_json,
          score_p, score_f, score_n, route, caveat,
          result_title, result_subtitle, first_action,
          stages_json, seven_days_json,
          utm_source, utm_campaign, qr_variant,
          current_page_path, client_ip, user_agent
        ) VALUES (
          ?, ?, ?, 1,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?
        )
      `).bind(
        newSubmissionId, nowIso, nowIso,
        source, eventId,
        sector || null, sectorName || null, JSON.stringify(cleanAnswers),
        scoreP, scoreF, scoreN, route, caveat || null,
        resultTitle || null, resultSubtitle || null, firstAction || null,
        stagesJson, sevenDaysJson,
        utmSource || null, utmCampaign || null, qrVariant || null,
        currentPagePath || null, clientIp, userAgent
      ).run();

      return new Response(JSON.stringify({
        success: true,
        submission_id: newSubmissionId,
        revision: 1,
        created: true,
      }), {
        status: 201,
        headers,
      });

    } catch (dbInsertErr) {
      console.error('[survey] D1 write error:', dbInsertErr.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Lỗi cơ sở dữ liệu khi lưu khảo sát.',
      }), {
        status: 500,
        headers,
      });
    }

  } catch (err) {
    console.error('[survey] Unexpected error:', err.stack || err.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Hệ thống đang bận. Vui lòng thử lại sau.',
    }), {
      status: 500,
      headers,
    });
  }
}

// ─── OPTIONS PREFLIGHT ───────────────────────────────────────────────────
export async function onRequestOptions(context) {
  const headers = getCorsHeaders(context.request);
  headers['Access-Control-Max-Age'] = '86400';
  return new Response(null, {
    status: 204,
    headers,
  });
}

// ─── REJECT GET REQUESTS ─────────────────────────────────────────────────
export async function onRequestGet(context) {
  const headers = getCorsHeaders(context.request);
  return new Response(JSON.stringify({ success: false, error: 'Phương thức không được hỗ trợ. Vui lòng sử dụng POST.' }), {
    status: 405,
    headers,
  });
}

// ─── CORS HELPER ─────────────────────────────────────────────────────────
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
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
