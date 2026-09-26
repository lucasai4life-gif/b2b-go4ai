/**
 * POST /api/leads
 * Unified lead capture for b2b.go4ai.org
 * Handles both enterprise consultation (Form A) and Claude workshop registration (Form B)
 *
 * Fully hardened against:
 * - Spam / Flooding / Replay attacks
 * - Malicious URLs / Phishing / Link shorteners
 * - Casino / Gambling / Betting spam
 * - Script / HTML injection
 * - Unauthorized / unverified bots via Cloudflare Turnstile
 */

import {
  checkRequestHeaders,
  sanitizeField,
  validateEmail,
  validatePhone,
  checkIpRateLimit,
  recordIpFailure,
  verifyTurnstile,
  computePayloadHash,
  evaluateSpam,
  logSecurityEvent,
} from './_security.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const clientIp = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   '127.0.0.1';

  try {
    // ─── 1. REQUEST HEADERS & SIZE HARDENING ──────────────────────────
    const headerCheck = checkRequestHeaders(request);
    if (!headerCheck.ok) {
      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'header_check_failed',
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
        action: 'rate_limited',
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

    // Prevent prototype pollution attempts
    if (Object.prototype.hasOwnProperty.call(body, '__proto__') || Object.prototype.hasOwnProperty.call(body, 'constructor')) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({ success: false, error: 'Yêu cầu không hợp lệ.' }), {
        status: 400,
        headers,
      });
    }

    // ─── 4. EXTRACT & SANITIZE FIELDS ─────────────────────────────────
    const name       = sanitizeField(body.name || body.full_name, 100);
    const email      = sanitizeField(body.email, 254).toLowerCase();
    const phone      = sanitizeField(body.phone, 25);
    const company    = sanitizeField(body.company, 150);
    const role       = sanitizeField(body.role || body.job_title, 100);
    const leadType   = sanitizeField(body.leadType, 64);
    const source     = sanitizeField(body.source, 64);
    const sourcePage = sanitizeField(body.sourcePage, 255);
    const sourceCta  = sanitizeField(body.sourceCta, 100);

    // UTM + referrer
    const utmSource   = sanitizeField(body.utm_source, 100);
    const utmMedium   = sanitizeField(body.utm_medium, 100);
    const utmCampaign = sanitizeField(body.utm_campaign, 100);
    const utmContent  = sanitizeField(body.utm_content, 100);
    const referrer    = sanitizeField(body.referrer, 300);

    // Extra form-specific fields
    const payloadExtra = {};
    const allowedExtra = [
      'companySize', 'interest', 'problem', 'privacyConsent',
      'aiLevel', 'mostInterested', 'intent', 'job_title',
      'program', 'message', 'full_name'
    ];
    for (const k of allowedExtra) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
        if (Array.isArray(body[k])) {
          payloadExtra[k] = body[k].slice(0, 10).map(v => sanitizeField(v, 100));
        } else if (typeof body[k] === 'boolean') {
          payloadExtra[k] = body[k];
        } else {
          payloadExtra[k] = sanitizeField(body[k], 1000);
        }
      }
    }

    // ─── 5. VALIDATE REQUIRED BUSINESS RULES ──────────────────────────
    if (!email || !validateEmail(email)) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({ success: false, error: 'Email không hợp lệ. Vui lòng kiểm tra lại.' }), {
        status: 422,
        headers,
      });
    }

    if (phone && !validatePhone(phone)) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({ success: false, error: 'Số điện thoại không hợp lệ.' }), {
        status: 422,
        headers,
      });
    }

    if (!leadType || !['enterprise_consultation', 'claude_workshop_registration'].includes(leadType)) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({ success: false, error: 'Loại yêu cầu không hợp lệ.' }), {
        status: 422,
        headers,
      });
    }

    // ─── 6. SPAM & MALICIOUS CONTENT PRE-CHECK ────────────────────────
    // Reject explicit attacks (gambling, malicious links, script injection)
    // BEFORE making external network calls to Cloudflare Turnstile.
    const preSpamEval = evaluateSpam({
      payload: { ...body, name, email, phone, company, role, ...payloadExtra },
      turnstileResult: { success: true }, // isolate content evaluation
    });

    if (preSpamEval.isBlocked) {
      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'spam_blocked',
        clientIp,
        leadType,
        score: preSpamEval.score,
        reasons: preSpamEval.reasons,
        status: 400,
      });

      return new Response(JSON.stringify({
        success: false,
        code: 'SPAM_CONTENT_REJECTED',
        error: 'Nội dung không hợp lệ hoặc chứa liên kết không được chấp nhận.'
      }), {
        status: 400,
        headers,
      });
    }

    // ─── 7. CLOUDFLARE TURNSTILE SERVER-SIDE VERIFICATION ─────────────
    const turnstileToken = body.turnstileToken || body['cf-turnstile-response'];
    const turnstileRes = await verifyTurnstile({
      token: turnstileToken,
      secret: env.TURNSTILE_SECRET_KEY,
      remoteIp: clientIp,
    });

    if (!turnstileRes.success) {
      // ── 503: the server-side secret is missing (a deployment error, not a visitor error).
      // Fail closed — the request does NOT pass — but deliberately do NOT record an IP
      // failure: jailing real visitors because our own environment is misconfigured would
      // turn a config mistake into a self-inflicted outage.
      if (turnstileRes.notConfigured) {
        logSecurityEvent({
          action: 'turnstile_not_configured',
          clientIp,
          leadType,
          score: 0,
          reasons: ['turnstile_not_configured'],
          status: 503,
        });

        return new Response(JSON.stringify({
          success: false,
          code: 'TURNSTILE_NOT_CONFIGURED',
          error: 'Hệ thống xác thực bảo mật chưa được cấu hình. Vui lòng liên hệ GO4AI.'
        }), {
          status: 503,
          headers,
        });
      }

      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'turnstile_rejected',
        clientIp,
        leadType,
        score: 100,
        reasons: [turnstileRes.reason || 'turnstile_fail'],
        errorCodes: turnstileRes.errorCodes,
        status: 403,
      });

      return new Response(JSON.stringify({
        success: false,
        code: turnstileRes.reason === 'missing_token' ? 'TURNSTILE_REQUIRED' : 'TURNSTILE_FAILED',
        error: turnstileRes.error || 'Xác thực bảo mật không thành công. Vui lòng thử lại.'
      }), {
        status: 403,
        headers,
      });
    }

    // ─── 8. FINAL SPAM SCORING ─────────────────────────────────────────
    const spamEval = evaluateSpam({
      payload: { ...body, name, email, phone, company, role, ...payloadExtra },
      turnstileResult: turnstileRes,
    });

    // ─── 8. DUPLICATE & REPLAY PROTECTION ─────────────────────────────
    const payloadHash = await computePayloadHash({
      leadType, email, phone, name, company,
      problem: payloadExtra.problem,
      message: payloadExtra.message,
    });

    // D1 is the source of truth. Never mark a payload as received before an INSERT succeeds.
    // An isolate-memory marker here previously made retries look successful after a D1 error.
    if (env.DB) {
      try {
        // Check identical payload within 10 minutes in D1
        const dupCheck = await env.DB.prepare(`
          SELECT id FROM leads
          WHERE payload_hash = ? AND julianday(created_at) > julianday('now', '-10 minutes')
          LIMIT 1
        `).bind(payloadHash).first();

        if (dupCheck) {
          logSecurityEvent({
            action: 'duplicate_replay_detected_db',
            clientIp,
            leadType,
            reasons: ['db_hash_match'],
          });
          return new Response(JSON.stringify({
            success: true,
            duplicate: true,
            leadId: dupCheck.id,
            message: 'Yêu cầu của bạn đã được ghi nhận trước đó.'
          }), {
            status: 200,
            headers,
          });
        }

        // Rolling limit: max 2 submissions per email per 10 minutes
        const emailRateCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM leads
          WHERE email = ? AND julianday(created_at) > julianday('now', '-10 minutes')
        `).bind(email).first();

        if (emailRateCheck && emailRateCheck.count >= 2) {
          logSecurityEvent({
            action: 'email_rate_limit_exceeded',
            clientIp,
            leadType,
            reasons: ['email_frequency_limit'],
          });
          return new Response(JSON.stringify({
            success: false,
            error: 'Bạn đã gửi yêu cầu gần đây. Chúng tôi đã nhận được thông tin và sẽ phản hồi sớm.'
          }), {
            status: 429,
            headers,
          });
        }

        // Rolling limit: max 2 submissions per phone per 10 minutes (if phone is given)
        if (phone) {
          const phoneRateCheck = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM leads
            WHERE phone = ? AND julianday(created_at) > julianday('now', '-10 minutes')
          `).bind(phone).first();

          if (phoneRateCheck && phoneRateCheck.count >= 2) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Số điện thoại này đã gửi yêu cầu gần đây. Vui lòng đợi trong ít phút.'
            }), {
              status: 429,
              headers,
            });
          }
        }
      } catch (dbQueryErr) {
        console.warn('[leads] Rate query warning:', dbQueryErr.message);
      }
    }

    // ─── 9. WRITE TO D1 DATABASE ──────────────────────────────────────
    const createdAt = new Date().toISOString();
    let leadId;
    const initialTelegramStatus = spamEval.isSuspicious
      ? 'quarantined'
      : (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? 'pending' : 'not_configured');

    try {
      const result = await env.DB.prepare(`
        INSERT INTO leads (
          lead_type, source, source_page, source_cta,
          name, email, phone, company, role,
          payload_json,
          utm_source, utm_medium, utm_campaign, utm_content,
          referrer, telegram_status, created_at,
          client_ip, spam_score, spam_reasons, payload_hash
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?
        )
      `).bind(
        leadType, source, sourcePage || '', sourceCta || '',
        name || '', email, phone || '', company || '', role || '',
        JSON.stringify(payloadExtra),
        utmSource || null, utmMedium || null, utmCampaign || null, utmContent || null,
        referrer || null, initialTelegramStatus, createdAt,
        clientIp, spamEval.score, spamEval.reasons.join(','), payloadHash
      ).run();

      if (result.success === false) throw new Error('D1 INSERT returned success=false');
      leadId = result.meta?.last_row_id;
    } catch (dbErr) {
      console.error('[leads] D1 write error:', dbErr.message);
      return new Response(JSON.stringify({ success: false, error: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại.' }), {
        status: 500,
        headers,
      });
    }

    // ─── 10. TELEGRAM NOTIFICATION (Strictly Clean Leads Only) ────────
    // Suspicious leads are quarantined in D1 and NEVER sent to Telegram!
    let telegramStatus = initialTelegramStatus;

    if (spamEval.isClean && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      // The D1 payload check already handles identical retries. Different accepted leads
      // from the same email must each notify the team.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const message = buildTelegramMessage({
          leadType, source, sourcePage, sourceCta,
          name, email, phone, company, role,
          payloadExtra, createdAt
        });
        const tgRes = await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: env.TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: 'HTML'
            }),
            signal: controller.signal,
          }
        );
        const tgData = await tgRes.json();
        telegramStatus = tgRes.ok && tgData.ok ? 'sent' : 'failed';
      } catch (tgErr) {
        console.error('[leads] Telegram delivery error:', tgErr.message);
        telegramStatus = 'error';
      } finally {
        clearTimeout(timeout);
      }

      try {
        await env.DB.prepare('UPDATE leads SET telegram_status = ? WHERE id = ?')
          .bind(telegramStatus, leadId).run();
      } catch (statusErr) {
        console.error('[leads] D1 telegram status update error:', statusErr.message);
      }
    }

    logSecurityEvent({
      action: spamEval.isSuspicious ? 'lead_quarantined' : 'lead_accepted',
      clientIp,
      leadType,
      score: spamEval.score,
      reasons: spamEval.reasons,
      status: 201,
    });

    return new Response(JSON.stringify({
      success: true,
      leadId,
      telegramStatus,
      message: 'Yêu cầu của bạn đã được gửi thành công.'
    }), {
      status: 201,
      headers,
    });

  } catch (err) {
    console.error('[leads] Unexpected handler exception:', err.stack || err.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.'
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
    'Access-Control-Allow-Headers': 'Content-Type, cf-turnstile-response',
  };
}

// ─── TELEGRAM MESSAGE BUILDER ────────────────────────────────────────────
function esc(val) {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function line(label, val) {
  if (!val || String(val).trim() === '') return '';
  return `\n<b>${esc(label)}:</b> ${esc(val)}`;
}

function buildTelegramMessage(data) {
  const { leadType, source, sourcePage, sourceCta, name, email, phone, company, role, payloadExtra, createdAt } = data;
  const dt = new Date(createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  if (leadType === 'enterprise_consultation') {
    const interestList = Array.isArray(payloadExtra.interest)
      ? payloadExtra.interest.join(', ')
      : payloadExtra.interest || '';

    return [
      '🟢 <b>NEW ENTERPRISE LEAD</b>',
      `\nNguồn: Website chính`,
      line('CTA', sourceCta),
      line('Trang', sourcePage),
      '\n──────────────',
      line('Họ tên', name),
      line('Email', email),
      line('Điện thoại', phone),
      line('Doanh nghiệp', company),
      line('Chức vụ', role),
      line('Quy mô', payloadExtra.companySize),
      line('Nhu cầu', interestList),
      line('Bài toán', payloadExtra.problem),
      `\n──────────────`,
      `\n<i>${dt}</i>`,
    ].filter(Boolean).join('');
  }

  if (leadType === 'claude_workshop_registration') {
    return [
      '🔵 <b>NEW CLAUDE WORKSHOP REGISTRATION</b>',
      `\nNguồn: Claude Landing Page (/claude/)`,
      '\n──────────────',
      line('Họ tên', name),
      line('Email', email),
      line('Điện thoại', phone),
      line('Doanh nghiệp', company),
      line('Vai trò', role || payloadExtra.job_title),
      line('Mức độ dùng AI', payloadExtra.aiLevel),
      line('Muốn xem nhất', payloadExtra.mostInterested),
      line('Chương trình', payloadExtra.program),
      line('Mục tiêu', payloadExtra.intent),
      line('Ghi chú / Việc cụ thể', payloadExtra.message),
      `\nTrang: ${esc(sourcePage || '/claude/')}`,
      `\n──────────────`,
      `\n<i>${dt}</i>`,
    ].filter(Boolean).join('');
  }

  return `📋 <b>NEW LEAD</b>\nType: ${esc(leadType)}\nSource: ${esc(source)}\nEmail: ${esc(email)}\n<i>${dt}</i>`;
}
