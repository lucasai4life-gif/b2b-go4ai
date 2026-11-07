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
import { issueOpportunityToken } from './_opportunity-token.js';

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

    // ─── 3.1 FOUNDING TALENT LANDING PAGE LEAD DISPATCH ───────────────
    const isFoundingTalent = body.leadType === 'founding_talent' ||
      (body.strength !== undefined && body.motivation !== undefined && (body.segment !== undefined || body.acceptTerms !== undefined));

    if (isFoundingTalent) {
      return await handleFoundingTalentLead({ context, body, clientIp, headers });
    }

    // ─── 3.2 PROGRAM LEAD DISPATCH (/cafe-talk, /ai-foundation, /ai-builder) ──
    const isProgramLead =
      body.leadType === 'cafe_talk_registration' ||
      body.leadType === 'program_lead' ||
      (typeof body.program === 'string' && SUPPORTED_PROGRAMS.includes(body.program.trim().toUpperCase())) ||
      body.su_kien === 'SME_EXECUTIVE_14_11_2026' ||
      body.ho_ten !== undefined ||
      body.dien_thoai !== undefined ||
      body.nguon_biet_den !== undefined;

    if (isProgramLead) {
      return await handleProgramLead({ context, body, clientIp, headers });
    }

    // ─── 4. EXTRACT & SANITIZE FIELDS ─────────────────────────────────
    const contact    = (body.contact && typeof body.contact === 'object') ? body.contact : {};
    const name       = sanitizeField(body.name || body.full_name || contact.name, 100);
    const email      = sanitizeField(body.email || contact.email, 254).toLowerCase();
    const phone      = sanitizeField(body.phone || contact.phone, 25);
    const company    = sanitizeField(body.company || contact.company, 150);
    const role       = sanitizeField(body.role || body.job_title || contact.role, 100);
    const leadType   = sanitizeField(body.leadType, 64);
    const source     = sanitizeField(body.source, 64);
    const sourcePage = sanitizeField(body.sourcePage || (leadType === 'baogiaxnk_diagnostic' ? '/baogiaxnk' : ''), 255);
    const sourceCta  = sanitizeField(body.sourceCta || (leadType === 'baogiaxnk_diagnostic' ? 'diagnostic_form' : ''), 100);

    // UTM + referrer
    const utmSource   = sanitizeField(body.utm_source || body.source, 100);
    const utmMedium   = sanitizeField(body.utm_medium, 100);
    const utmCampaign = sanitizeField(body.utm_campaign || body.campaign, 100);
    const utmContent  = sanitizeField(body.utm_content, 100);
    const referrer    = sanitizeField(body.referrer, 300);

    // Extra form-specific fields
    const payloadExtra = {};
    const allowedExtra = [
      'companySize', 'interest', 'problem', 'privacyConsent',
      'aiLevel', 'mostInterested', 'intent', 'job_title',
      'program', 'message', 'full_name',
      // ── Form 6 câu của landing 90 phút (chốt 2026-09-26) ──────────────
      // Không có trường nào là văn bản tự do do khách viết: cả 5 câu đầu là
      // lựa chọn có cấu trúc, câu 6 là 3 ô liên hệ. Nhờ vậy phân hạng dưới
      // đây là suy diễn tất định từ lựa chọn, KHÔNG phải đoán từ văn bản.
      'q1_interested', 'q2_persona', 'q3_goal', 'q4_support', 'q5_timing',
      'leadTier', 'tierReason',
      // ── Trang /opp/ — quan tâm gói thành viên 12 tháng ─────────────────
      // `message` là ô tự do DUY NHẤT, chỉ bắt buộc cho tầng hợp tác (PARTNER).
      'package', 'startTimeline', 'partnerHave', 'pageState', 'claude90Registered'
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

    // ── Form Chẩn đoán Báo giá XNK (/baogiaxnk) ─────────────────────────
    if (leadType === 'baogiaxnk_diagnostic') {
      payloadExtra.event_id = sanitizeField(body.event_id || 'coffee-for-business-2026-10-22', 100);
      payloadExtra.qr_variant = sanitizeField(body.qr_variant, 50);
      payloadExtra.recorded_at = sanitizeField(body.recorded_at, 50) || new Date().toISOString();
      payloadExtra.submission_id = sanitizeField(body.submission_id || body.questionnaire?.submission_id, 64);
      payloadExtra.contact = {
        name,
        phone,
        company,
        role,
        email,
        preferred_contact_time: sanitizeField(contact.preferred_contact_time || body.callTime, 100),
        message: sanitizeField(contact.message || body.note, 1000),
      };
      const q = (body.questionnaire && typeof body.questionnaire === 'object') ? body.questionnaire : {};
      payloadExtra.questionnaire = {
        sector: sanitizeField(q.sector || body.sector, 50),
        sector_name: sanitizeField(q.sector_name || body.sector_name, 100),
        answers: Array.isArray(q.answers) ? q.answers.slice(0, 15).map(v => typeof v === 'number' ? v : sanitizeField(v, 50)) : [],
        paper_score: sanitizeField(q.paper_score || body.paperScore, 20),
        points: {
          P: Number(q.points?.P ?? body.points_P ?? 0),
          F: Number(q.points?.F ?? body.points_F ?? 0),
          N: Number(q.points?.N ?? body.points_N ?? 0),
        },
        route: sanitizeField(q.route || body.route || body.result_route, 10),
        advisory_note: sanitizeField(q.advisory_note || body.advisory_note, 500),
      };
      const req = (body.requests && typeof body.requests === 'object') ? body.requests : {};
      payloadExtra.requests = {
        lead_intent: sanitizeField(req.lead_intent || body.lead_intent, 50),
        diagnostic_60min: Boolean(req.diagnostic_60min ?? body.diagnostic_60min),
        seven_day_plan: Boolean(req.seven_day_plan ?? body.seven_day_plan),
      };
      payloadExtra.consent = {
        contact_for_this_assessment: Boolean(body.consent?.contact_for_this_assessment ?? true),
      };
      payloadExtra.message = payloadExtra.contact.message;
    }

    // ─── 5. VALIDATE REQUIRED BUSINESS RULES ──────────────────────────
    const VALID_LEAD_TYPES = [
      'enterprise_consultation',
      'claude_workshop_registration',
      'membership_interest',
      'baogiaxnk_diagnostic'
    ];
    if (!leadType || !VALID_LEAD_TYPES.includes(leadType)) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({ success: false, error: 'Loại yêu cầu không hợp lệ.' }), {
        status: 422,
        headers,
      });
    }

    if (leadType === 'baogiaxnk_diagnostic') {
      if (!name) {
        recordIpFailure(clientIp);
        return new Response(JSON.stringify({ success: false, error: 'Vui lòng cung cấp họ tên.' }), {
          status: 422,
          headers,
        });
      }
      if (!phone || !validatePhone(phone)) {
        recordIpFailure(clientIp);
        return new Response(JSON.stringify({ success: false, error: 'Số điện thoại hoặc Zalo không hợp lệ.' }), {
          status: 422,
          headers,
        });
      }
      if (!company) {
        recordIpFailure(clientIp);
        return new Response(JSON.stringify({ success: false, error: 'Vui lòng cung cấp tên doanh nghiệp.' }), {
          status: 422,
          headers,
        });
      }
      if (email && !validateEmail(email)) {
        recordIpFailure(clientIp);
        return new Response(JSON.stringify({ success: false, error: 'Email không hợp lệ. Vui lòng kiểm tra lại hoặc để trống.' }), {
          status: 422,
          headers,
        });
      }
      const consentVal = body.consent?.contact_for_this_assessment ?? body.privacyConsent ?? true;
      if (!consentVal) {
        recordIpFailure(clientIp);
        return new Response(JSON.stringify({ success: false, error: 'Vui lòng xác nhận đồng ý cho GO4AI liên hệ.' }), {
          status: 422,
          headers,
        });
      }
    } else {
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

      if (leadType === 'membership_interest' && !MEMBERSHIP_PACKAGES.includes(payloadExtra.package)) {
        recordIpFailure(clientIp);
        return new Response(JSON.stringify({ success: false, error: 'Vui lòng chọn con đường bạn quan tâm.' }), {
          status: 422,
          headers,
        });
      }
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
    let turnstileRes = { success: true };
    if (leadType !== 'baogiaxnk_diagnostic') {
      const turnstileToken = body.turnstileToken || body['cf-turnstile-response'];
      turnstileRes = await verifyTurnstile({
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
    }

    // ─── 8. FINAL SPAM SCORING ─────────────────────────────────────────
    const spamEval = evaluateSpam({
      payload: { ...body, name, email, phone, company, role, ...payloadExtra },
      turnstileResult: turnstileRes,
    });

    // ─── 8. DUPLICATE & REPLAY PROTECTION ─────────────────────────────
    const payloadHash = await computePayloadHash({
      leadType, email, phone, name, company,
      // Cùng một người quan tâm LEARN rồi EARN trong 10 phút là HAI nhu cầu, không phải replay.
      problem: leadType === 'membership_interest'
        ? `${payloadExtra.package}|${payloadExtra.message || ''}`
        : (leadType === 'baogiaxnk_diagnostic'
          ? `${payloadExtra.questionnaire?.route || ''}|${payloadExtra.contact?.message || ''}`
          : payloadExtra.problem),
      message: payloadExtra.message,
    });

    // D1 is the source of truth. Never mark a payload as received before an INSERT succeeds.
    // An isolate-memory marker here previously made retries look successful after a D1 error.
    if (env.DB) {
      try {
        // Check identical payload within 10 minutes in D1
        const dupCheck = await env.DB.prepare(`
          SELECT id, email, created_at FROM leads
          WHERE payload_hash = ? AND julianday(created_at) > julianday('now', '-10 minutes')
          LIMIT 1
        `).bind(payloadHash).first();

        if (dupCheck) {
          const opportunityToken = leadType === 'claude_workshop_registration'
            ? await issueOpportunityToken(env.TURNSTILE_SECRET_KEY, dupCheck) : null;
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
            ...(opportunityToken ? { opportunityToken } : {}),
            message: 'Yêu cầu của bạn đã được ghi nhận trước đó.'
          }), {
            status: 200,
            headers,
          });
        }

        // Rolling limit: max 2 submissions per email per 10 minutes (only if email is provided)
        if (email) {
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
    if (leadType === 'claude_workshop_registration') {
      payloadExtra.workshop_source = utmSource || source || 'claude_landing_page';
      payloadExtra.registered_at = createdAt;
    }
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

      if (leadType === 'baogiaxnk_diagnostic' && payloadExtra.submission_id && env.DB) {
        try {
          await env.DB.prepare('UPDATE baogiaxnk_surveys SET lead_id = ?, updated_at = ? WHERE submission_id = ?')
            .bind(leadId, createdAt, payloadExtra.submission_id).run();
        } catch (linkErr) {
          console.warn('[leads] Link survey warning:', linkErr.message);
        }
      }
    } catch (dbErr) {
      console.error('[leads] D1 write error:', dbErr.message);
      return new Response(JSON.stringify({ success: false, error: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại.' }), {
        status: 500,
        headers,
      });
    }

    const opportunityToken = leadType === 'claude_workshop_registration'
      ? await issueOpportunityToken(env.TURNSTILE_SECRET_KEY, { id: leadId, email, created_at: createdAt }) : null;

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
      ...(opportunityToken ? { opportunityToken } : {}),
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

// PARTNER là tầng 03 BÊN TRONG BUILD, không phải gói thứ tư — nhãn nội bộ phải nói đúng điều đó.
const MEMBERSHIP_PACKAGES = ['LEARN', 'EARN', 'BUILD', 'PARTNER'];
const MEMBERSHIP_LABELS = {
  LEARN: '🟢 LEARN — 10M/năm (cá nhân)',
  EARN: '🔵 EARN — 30M/năm (chuyên môn)',
  BUILD: '🔴 BUILD — 100M/năm (doanh nghiệp)',
  PARTNER: '🔴 BUILD · tầng 03 — trao đổi hợp tác',
};

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
    if (!payloadExtra.q1_interested) {
      return [
        '🔵 <b>NEW CLAUDE 90-MIN REGISTRATION</b>',
        line('Họ tên', name),
        line('Điện thoại / Zalo', phone),
        line('Email', email),
        line('Nguồn', source),
        `\n<i>${dt}</i>`,
      ].filter(Boolean).join('');
    }

    /* ── PHÂN HẠNG TỰ ĐỘNG (chốt 2026-09-26) ─────────────────────────────
       Tier đến từ routeLeadTier() phía client — suy TẤT ĐỊNH từ 5 câu chọn,
       không đọc văn bản tự do (form không có ô tự do nào).
       Tier là thông tin NỘI BỘ: dùng để chọn brochure + thứ tự follow-up.
       ⛔ KHÔNG hiển thị giá cho khách ở landing; ở thông báo nội bộ thì được,
       vì người nhận là đội GO4AI đang phân loại lead. */
    const tierMap = {
      'MEMBER': '🟢 MEMBER — 10M (sinh viên / người trẻ)',
      'PRO': '🔵 PRO — 30M (professional / freelancer / trainer)',
      'STRATEGIC PARTNER': '🔴 STRATEGIC PARTNER — 100M + cơ hội chiến lược',
    };
    const tier = payloadExtra.leadTier || '';
    const tierLine = tier
      ? `\n🎯 <b>PHÂN HẠNG TỰ ĐỘNG</b>: ${esc(tierMap[tier] || tier)}`
      : '';

    return [
      '🔵 <b>NEW CLAUDE 90-MIN REGISTRATION</b>',
      `\nNguồn: Landing 90 phút (/claude/)`,
      '\n──────────────',
      line('Họ tên', name),
      line('Điện thoại / Zalo', phone),
      line('Email', email),
      '\n──────────────',
      '\n<b>6 CÂU TRẢ LỜI</b>',
      line('1 · Quan tâm nhất', payloadExtra.q1_interested),
      line('2 · Hiện tại là', payloadExtra.q2_persona),
      line('3 · Kết quả 12 tháng', payloadExtra.q3_goal),
      line('4 · Muốn hỗ trợ', payloadExtra.q4_support),
      line('5 · Bắt đầu', payloadExtra.q5_timing),
      line('Chương trình', payloadExtra.program),
      tierLine,
      payloadExtra.tierReason ? `\n<i>Vì: ${esc(payloadExtra.tierReason)}</i>` : '',
      `\nTrang: ${esc(sourcePage || '/claude/')}`,
      `\n──────────────`,
      `\n<i>${dt}</i>`,
    ].filter(Boolean).join('');
  }

  if (leadType === 'membership_interest') {
    const have = Array.isArray(payloadExtra.partnerHave) ? payloadExtra.partnerHave.join(', ') : '';
    return [
      '🟣 <b>QUAN TÂM GÓI THÀNH VIÊN</b>',
      `\nNguồn: /opp/`,
      `\n🎯 <b>${esc(MEMBERSHIP_LABELS[payloadExtra.package] || payloadExtra.package)}</b>`,
      '\n──────────────',
      line('Họ tên', name),
      line('Điện thoại / Zalo', phone),
      line('Email', email),
      line('Doanh nghiệp', company),
      line('Bắt đầu', payloadExtra.startTimeline),
      line('Có sẵn', have),
      line('Mô tả hợp tác', payloadExtra.message),
      payloadExtra.claude90Registered ? '\n✅ Đã đăng ký Claude 90 phút (cùng thiết bị)' : '',
      line('Trạng thái trang', payloadExtra.pageState),
      line('CTA', sourceCta),
      `\n──────────────`,
      `\n<i>${dt}</i>`,
    ].filter(Boolean).join('');
  }

  if (leadType === 'baogiaxnk_diagnostic') {
    const q = payloadExtra.questionnaire || {};
    const req = payloadExtra.requests || {};
    const contact = payloadExtra.contact || {};
    const routeTitles = {
      A: 'A — Nên bắt đầu bằng năng lực đội ngũ',
      B: 'B — Nên ưu tiên quy trình và dữ liệu trước AI',
      C: 'C — Có thể khảo sát thí điểm ứng dụng AI vào báo giá',
      D: 'D — Cần chọn bài toán hẹp trước khi đầu tư'
    };
    const routeCode = q.route || '';
    const routeDisplay = routeTitles[routeCode] || (routeCode ? `Hướng ${routeCode}` : 'Chưa xác định');
    const points = q.points || {};
    const pStr = `Đội ngũ ${points.P ?? '?'}/6 · Quy trình & DL ${points.F ?? '?'}/6 · Tốc độ & RR ${points.N ?? '?'}/6`;

    return [
      '📊 <b>[LEAD] CHẨN ĐOÁN BÁO GIÁ XNK</b>',
      `\nNguồn: <code>/baogiaxnk</code>`,
      payloadExtra.submission_id ? `\nMã khảo sát: <code>${esc(payloadExtra.submission_id)}</code>` : '',
      payloadExtra.event_id ? `\nSự kiện: <code>${esc(payloadExtra.event_id)}</code>` : '',
      '\n──────────────',
      line('Họ tên', name),
      line('Công ty', company),
      line('Điện thoại / Zalo', phone),
      line('Chức vụ', role),
      email ? line('Email', email) : '',
      '\n──────────────',
      '\n<b>KẾT QUẢ CHẨN ĐOÁN</b>',
      line('Hướng đề xuất', routeDisplay),
      line('Điểm số', pStr),
      q.paper_score ? line('Điểm tự chấm (giấy)', `${q.paper_score}/12`) : '',
      line('Ngành hàng', q.sector_name || q.sector),
      '\n──────────────',
      '\n<b>NHU CẦU & YÊU CẦU</b>',
      `\n<b>Hẹn trao đổi 60 phút:</b> ${req.diagnostic_60min ? '✅ Có' : '❌ Không'}`,
      `\n<b>Kế hoạch 7 ngày:</b> ${req.seven_day_plan ? '✅ Có' : '❌ Không'}`,
      contact.preferred_contact_time ? line('Khung giờ liên hệ', contact.preferred_contact_time) : '',
      contact.message ? line('Ghi chú thêm', contact.message) : '',
      `\n──────────────`,
      `\n<i>${dt}</i>`,
    ].filter(Boolean).join('');
  }

  return `📋 <b>NEW LEAD</b>\nType: ${esc(leadType)}\nSource: ${esc(source)}\nEmail: ${esc(email)}\n<i>${dt}</i>`;
}

// ─── FOUNDING TALENT LEAD HANDLER & HELPERS ──────────────────────────────
const FT_SEGMENTS = ['student', 'employee', 'founder', 'other'];
const FT_STRENGTHS = ['business', 'technology', 'ecosystem', 'operations'];
const FT_MODES = ['online', 'offline', 'hybrid'];
const FT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FT_PHONE_RE = /^\+?[0-9 .-]{8,16}$/;

const ftClean = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
const ftCleanMultiline = (v) => (typeof v === 'string' ? v.trim().replace(/\r\n/g, '\n') : '');

function validateFoundingTalentLead(input = {}) {
  const errors = {};
  const data = {
    fullName: ftClean(input.fullName || input.name),
    email: ftClean(input.email).toLowerCase(),
    phone: ftClean(input.phone),
    segment: ftClean(input.segment),
    segmentOther: ftClean(input.segmentOther),
    organization: ftClean(input.organization || input.company),
    strength: ftClean(input.strength),
    project: ftCleanMultiline(input.project),
    motivation: ftCleanMultiline(input.motivation),
    mode: ftClean(input.mode),
    hoursPerWeek: Number(input.hoursPerWeek),
    acceptTerms: input.acceptTerms === true,
    acceptPrivacy: input.acceptPrivacy === true,
    source: ftClean(input.source).slice(0, 200),
  };

  if (data.fullName.length < 2 || data.fullName.length > 100) errors.fullName = 'Vui lòng nhập họ và tên (2–100 ký tự).';
  if (!FT_EMAIL_RE.test(data.email) || data.email.length > 254) errors.email = 'Email chưa đúng định dạng.';
  if (data.phone && !FT_PHONE_RE.test(data.phone)) errors.phone = 'Số điện thoại chưa đúng định dạng.';
  if (!FT_SEGMENTS.includes(data.segment)) errors.segment = 'Vui lòng chọn nhóm ứng viên.';
  if (data.segment === 'other') {
    if (data.segmentOther.length < 2 || data.segmentOther.length > 100) errors.segmentOther = 'Vui lòng ghi rõ bạn thuộc nhóm nào (2–100 ký tự).';
  } else {
    data.segmentOther = '';
  }
  if (data.organization.length < 2 || data.organization.length > 200) errors.organization = 'Vui lòng nhập trường học / đơn vị.';
  if (!FT_STRENGTHS.includes(data.strength)) errors.strength = 'Vui lòng chọn thế mạnh chuyên môn.';
  if (data.project.length > 1000) errors.project = 'Tối đa 1000 ký tự.';
  if (data.motivation.length < 20) errors.motivation = 'Chia sẻ ít nhất 20 ký tự về động lực tham gia.';
  else if (data.motivation.length > 1000) errors.motivation = 'Tối đa 1000 ký tự.';
  if (!FT_MODES.includes(data.mode)) errors.mode = 'Vui lòng chọn hình thức tham gia.';
  if (!Number.isInteger(data.hoursPerWeek) || data.hoursPerWeek < 1 || data.hoursPerWeek > 80) {
    errors.hoursPerWeek = 'Nhập số giờ nguyên từ 1 đến 80.';
  }
  if (!data.acceptTerms) errors.acceptTerms = 'Bạn cần đồng ý với Thể lệ chương trình.';
  if (!data.acceptPrivacy) errors.acceptPrivacy = 'Bạn cần đồng ý với Chính sách xử lý dữ liệu cá nhân.';

  return Object.keys(errors).length ? { errors } : { data };
}

function newFoundingTalentCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `FTC26-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

async function hashFoundingTalentIp(ip, salt = 'go4ai-local') {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

const FT_LABELS = {
  segment: { student: 'Sinh viên', employee: 'Người đi làm', founder: 'Từng khởi nghiệp', other: 'Khác' },
  strength: { business: 'Business', technology: 'Technology', ecosystem: 'Ecosystem', operations: 'Operations' },
  mode: { online: 'Online', offline: 'Offline', hybrid: 'Hybrid' },
};

function formatFoundingTalentLeadMessage(lead) {
  const time = new Date(lead.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const clip = (s = '', n = 300) => (s.length > n ? `${s.slice(0, n)}…` : s);
  return [
    '<b>🟢 Lead mới — Founding Talent 2026</b>',
    `<code>${esc(lead.code)}</code> · ${esc(time)}`,
    '',
    `<b>Họ tên:</b> ${esc(lead.fullName)}`,
    `<b>Email:</b> ${esc(lead.email)}`,
    lead.phone ? `<b>SĐT:</b> ${esc(lead.phone)}` : null,
    `<b>Nhóm:</b> ${esc(lead.segment === 'other' && lead.segmentOther ? `Khác: ${lead.segmentOther}` : (FT_LABELS.segment[lead.segment] || lead.segment))} · ${esc(lead.organization)}`,
    `<b>Thế mạnh:</b> ${esc(FT_LABELS.strength[lead.strength] || lead.strength)}`,
    `<b>Hình thức:</b> ${esc(FT_LABELS.mode[lead.mode] || lead.mode)} · ${lead.hoursPerWeek} giờ/tuần`,
    '',
    `<b>Động lực:</b> ${esc(clip(lead.motivation))}`,
    lead.project ? `<b>Dự án:</b> ${esc(clip(lead.project, 200))}` : null,
    lead.source ? `<i>Nguồn: ${esc(lead.source)}</i>` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

async function sendFoundingTalentTelegram({ token, chatId, text }) {
  if (!token || !chatId) return { ok: false, error: 'not_configured' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) return { ok: false, error: body.description || `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.name === 'TimeoutError' ? 'timeout' : err.message };
  }
}

async function handleFoundingTalentLead({ context, body, clientIp, headers }) {
  const { env } = context;
  const now = new Date();
  const registrationClosesAt = env.REGISTRATION_CLOSES_AT || '2026-11-30T16:59:59Z';
  const seasonId = env.SEASON_ID || 'ftc-2026';
  const termsVersion = 'the-le-ftc-2026-v1';
  const privacyVersion = 'xu-ly-du-lieu-ftc-2026-v1';
  const ipHashSalt = env.IP_HASH_SALT || 'go4ai-local';

  // Honeypot: bot filled hidden field -> return fake success, do not save
  if (body?.website) {
    return new Response(
      JSON.stringify({ ok: true, code: newFoundingTalentCode(), createdAt: now.toISOString() }),
      {
        status: 201,
        headers: { ...headers, 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      }
    );
  }

  // Registration closes deadline check
  if (now >= new Date(registrationClosesAt)) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Đã hết hạn đăng ký mùa này.' }),
      {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      }
    );
  }

  // Validation
  const { data, errors } = validateFoundingTalentLead(body);
  if (errors) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Vui lòng kiểm tra lại các trường được đánh dấu.', errors }),
      {
        status: 422,
        headers: { ...headers, 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      }
    );
  }

  const code = newFoundingTalentCode();
  const lead = {
    ...data,
    code,
    seasonId,
    createdAt: now.toISOString(),
  };

  const payloadJson = JSON.stringify({
    code: lead.code,
    seasonId: lead.seasonId,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    segment: lead.segment,
    segmentOther: lead.segmentOther,
    organization: lead.organization,
    strength: lead.strength,
    project: lead.project,
    motivation: lead.motivation,
    mode: lead.mode,
    hoursPerWeek: lead.hoursPerWeek,
    termsVersion,
    privacyVersion,
    consentedAt: lead.createdAt,
    source: lead.source,
  });

  if (!env.DB) {
    console.error('[leads] Cơ sở dữ liệu (D1) chưa được kết nối.');
    return new Response(
      JSON.stringify({ ok: false, message: 'Cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.' }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      }
    );
  }

  // Check unique email in this season
  try {
    const existing = await env.DB.prepare(
      `SELECT id FROM leads WHERE (lead_type = 'founding_talent' OR lead_type = 'foundingtalent') AND email = ?`
    ).bind(lead.email).first();

    if (existing) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: 'Email này đã đăng ký mùa tuyển chọn 2026. Mỗi ứng viên chỉ có một hồ sơ trong một mùa.',
          errors: { email: 'Email đã được dùng để đăng ký mùa này.' },
        }),
        {
          status: 409,
          headers: { ...headers, 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
        }
      );
    }

    // Insert into unified leads table
    await env.DB.prepare(`
      INSERT INTO leads (
        lead_type, source, source_page, source_cta,
        name, email, phone, company, role,
        payload_json, utm_source, utm_medium, utm_campaign,
        telegram_status, created_at, client_ip, spam_score, spam_reasons, payload_hash
      ) VALUES (
        'founding_talent', ?, '/foundingtalent', 'register_form',
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        'pending', ?, ?, 0, '', ?
      )
    `).bind(
      lead.source || 'founding_talent_landing',
      lead.fullName,
      lead.email,
      lead.phone || null,
      lead.organization,
      lead.segment === 'other' && lead.segmentOther ? `Khác: ${lead.segmentOther}` : lead.segment,
      payloadJson,
      body.utm_source || null,
      body.utm_medium || null,
      body.utm_campaign || null,
      lead.createdAt,
      clientIp,
      lead.code
    ).run();

    // Also insert into dedicated founding_talent_leads table if available
    try {
      const ipHash = await hashFoundingTalentIp(clientIp, ipHashSalt);
      const userAgent = String((context.request && context.request.headers ? context.request.headers.get('user-agent') : '') || '').slice(0, 300);
      await env.DB.prepare(`
        INSERT INTO founding_talent_leads (
          code, season_id, full_name, email, phone, segment, segment_other, organization,
          strength, project, motivation, mode, hours_per_week, terms_version, privacy_version,
          consented_at, source, ip_hash, user_agent, telegram_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).bind(
        lead.code,
        lead.seasonId,
        lead.fullName,
        lead.email,
        lead.phone || null,
        lead.segment,
        lead.segmentOther || null,
        lead.organization,
        lead.strength,
        lead.project || null,
        lead.motivation,
        lead.mode,
        lead.hoursPerWeek,
        termsVersion,
        privacyVersion,
        lead.createdAt,
        lead.source || null,
        ipHash,
        userAgent,
        lead.createdAt
      ).run();
    } catch (ftErr) {
      console.warn('[leads] founding_talent_leads insert warning:', ftErr.message);
    }

  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('UNIQUE')) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: 'Email này đã đăng ký mùa tuyển chọn 2026. Mỗi ứng viên chỉ có một hồ sơ trong một mùa.',
          errors: { email: 'Email đã được dùng để đăng ký mùa này.' },
        }),
        {
          status: 409,
          headers: { ...headers, 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
        }
      );
    }
    console.error('[leads] Founding talent insert failed:', err);
    return new Response(
      JSON.stringify({ ok: false, message: 'Không lưu được hồ sơ. Vui lòng thử lại.' }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
      }
    );
  }

  // Telegram notification via Bot API
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    const sendPromise = (async () => {
      const text = formatFoundingTalentLeadMessage(lead);
      const res = await sendFoundingTalentTelegram({ token, chatId, text });
      const status = res.ok ? 'sent' : 'failed';
      const tgError = res.ok ? null : String(res.error).slice(0, 300);
      try {
        await env.DB.prepare(
          'UPDATE leads SET telegram_status = ? WHERE payload_hash = ?'
        ).bind(status, lead.code).run();
      } catch (e) {
        console.error('[leads] Update telegram status in leads table error:', e);
      }
      try {
        await env.DB.prepare(
          'UPDATE founding_talent_leads SET telegram_status = ?, telegram_error = ? WHERE code = ?'
        ).bind(status, tgError, lead.code).run();
      } catch (e) {
        console.error('[leads] Update telegram status in founding_talent_leads error:', e);
      }
    })();

    if (context.waitUntil) {
      context.waitUntil(sendPromise);
    } else {
      await sendPromise;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, code: lead.code, createdAt: lead.createdAt }),
    {
      status: 201,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}

// ─── PROGRAM LEAD HANDLER (/cafe-talk, /ai-foundation, /ai-builder) ──────
const SUPPORTED_PROGRAMS = [
  'CAFE_TALK_2026_11_14',
  'AI_FOUNDATION_2026_11_18',
  'AI_BUILDER_2026_11_21',
];

const PRIVACY_POLICY_VERSION = '2026-11';

function normalizeProgramPhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

function resolveServerProgram(body, landingPath) {
  const path = String(landingPath || '').toLowerCase();
  if (path.startsWith('/ai-foundation')) return 'AI_FOUNDATION_2026_11_18';
  if (path.startsWith('/ai-builder')) return 'AI_BUILDER_2026_11_21';
  if (path.startsWith('/cafe-talk')) return 'CAFE_TALK_2026_11_14';

  const requested = typeof body.program === 'string' ? body.program.trim().toUpperCase() : '';
  if (SUPPORTED_PROGRAMS.includes(requested)) return requested;
  return 'CAFE_TALK_2026_11_14';
}

function formatProgramTelegramMessage(lead) {
  const dt = new Date(lead.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const srcDisplay = lead.source === 'Nguồn khác' && lead.otherSource
    ? `Nguồn khác: ${lead.otherSource}`
    : lead.source;

  return [
    '☕ <b>[LEAD] ĐĂNG KÝ CHƯƠNG TRÌNH GO4AI</b>',
    `\nChương trình: <code>${esc(lead.program)}</code>`,
    lead.landingPath ? `\nTrang: <code>${esc(lead.landingPath)}</code>` : '',
    '\n──────────────',
    line('Họ tên', lead.fullName),
    line('Điện thoại / Zalo', lead.phone),
    lead.email ? line('Email', lead.email) : '',
    lead.jobTitle ? line('Chức danh', lead.jobTitle) : '',
    lead.company ? line('Doanh nghiệp', lead.company) : '',
    lead.interest ? line('Vấn đề quan tâm', lead.interest) : '',
    line('Nguồn biết đến', srcDisplay),
    `\n<b>Marketing Consent:</b> ${lead.marketingConsent ? '✅ Có' : '❌ Không'}`,
    `\n──────────────`,
    `\n<i>${dt}</i>`,
  ].filter(Boolean).join('');
}

async function handleProgramLead({ context, body, clientIp, headers }) {
  const { request, env } = context;

  // Honeypot check: if a hidden bot trap field is filled, return silent success without writing
  if (body?.website_url || body?.honeypot) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Đăng ký của bạn đã được ghi nhận.',
    }), { status: 200, headers });
  }

  const landingPath = sanitizeField(
    body.landing_path || body.sourcePage || '/cafe-talk',
    255
  );
  // Server-enforced program & status (never trust client status or admin notes)
  const program = resolveServerProgram(body, landingPath);
  const status = 'NEW';
  const notes = '';

  const fullName = sanitizeField(body.full_name || body.ho_ten || body.name || '', 100);
  const rawPhone = sanitizeField(body.phone || body.dien_thoai || '', 30);
  const phone = normalizeProgramPhone(rawPhone);
  const email = sanitizeField(body.email || '', 254).toLowerCase();
  const jobTitle = sanitizeField(body.job_title || body.chuc_danh || body.role || '', 120);
  const company = sanitizeField(body.company || body.doanh_nghiep || '', 150);
  const interest = sanitizeField(body.interest || body.van_de_quan_tam || '', 150);

  let rawSource = sanitizeField(body.source || body.nguon_biet_den || '', 120);
  let otherSource = sanitizeField(body.other_source || body.nguon_khac || body.nguon_chi_tiet || '', 200);

  if (rawSource.startsWith('Nguồn khác:') && !otherSource) {
    otherSource = sanitizeField(rawSource.slice('Nguồn khác:'.length).trim(), 200);
    rawSource = 'Nguồn khác';
  }

  // Tracking fields
  const utmSource = sanitizeField(body.utm_source || '', 100);
  const utmMedium = sanitizeField(body.utm_medium || '', 100);
  const utmCampaign = sanitizeField(body.utm_campaign || '', 100);
  const utmContent = sanitizeField(body.utm_content || '', 100);
  const utmTerm = sanitizeField(body.utm_term || '', 100);
  const referrer = sanitizeField(body.referrer || request.headers.get('referer') || '', 300);

  // Consent fields
  const privacyConsent =
    body.privacy_consent === true ||
    body.dong_y === true ||
    body.privacyConsent === true;
  const marketingConsent = Boolean(
    body.marketing_consent === true ||
    body.dong_y_marketing === true ||
    body.marketingConsent === true
  );

  // ─── 1. SERVER-SIDE VALIDATION ───────────────────────────────────────
  if (!fullName || fullName.length < 2) {
    recordIpFailure(clientIp);
    return new Response(JSON.stringify({
      success: false,
      field: 'full_name',
      error: 'Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự).',
    }), { status: 422, headers });
  }

  if (!phone || !validatePhone(phone)) {
    recordIpFailure(clientIp);
    return new Response(JSON.stringify({
      success: false,
      field: 'phone',
      error: 'Số điện thoại / Zalo không hợp lệ (cần 8–15 chữ số).',
    }), { status: 422, headers });
  }

  if (email && !validateEmail(email)) {
    recordIpFailure(clientIp);
    return new Response(JSON.stringify({
      success: false,
      field: 'email',
      error: 'Địa chỉ email không hợp lệ.',
    }), { status: 422, headers });
  }

  if (!rawSource) {
    recordIpFailure(clientIp);
    return new Response(JSON.stringify({
      success: false,
      field: 'source',
      error: 'Vui lòng chọn nguồn biết đến chương trình.',
    }), { status: 422, headers });
  }

  if (rawSource === 'Nguồn khác') {
    if (!otherSource || otherSource.length < 2) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({
        success: false,
        field: 'other_source',
        error: 'Vui lòng nhập cụ thể nguồn bạn biết đến chương trình.',
      }), { status: 422, headers });
    }
  } else {
    otherSource = '';
  }

  if (!privacyConsent) {
    recordIpFailure(clientIp);
    return new Response(JSON.stringify({
      success: false,
      field: 'privacy_consent',
      error: 'Vui lòng đồng ý Chính sách bảo mật và xử lý dữ liệu cá nhân để hoàn tất đăng ký.',
    }), { status: 422, headers });
  }

  // ─── 2. SPAM & MALICIOUS CONTENT CHECK ───────────────────────────────
  const spamEval = evaluateSpam({
    payload: {
      name: fullName,
      email,
      phone,
      company,
      role: jobTitle,
      interest,
      source: rawSource,
      otherSource,
    },
    turnstileResult: { success: true },
  });

  if (spamEval.isBlocked) {
    recordIpFailure(clientIp);
    logSecurityEvent({
      action: 'spam_blocked',
      clientIp,
      leadType: program,
      score: spamEval.score,
      reasons: spamEval.reasons,
      status: 400,
    });
    return new Response(JSON.stringify({
      success: false,
      code: 'SPAM_CONTENT_REJECTED',
      error: 'Nội dung gửi lên không hợp lệ hoặc chứa liên kết không được phép.',
    }), { status: 400, headers });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.',
    }), { status: 503, headers });
  }

  // ─── 3. DUPLICATE & RAPID DOUBLE-SUBMIT PROTECTION ───────────────────
  const payloadHash = await computePayloadHash({
    leadType: program,
    email,
    phone,
    name: fullName,
    company,
    problem: `${interest}|${rawSource}|${otherSource}|${marketingConsent ? '1' : '0'}`,
    message: jobTitle,
  });

  try {
    const dupCheck = await env.DB.prepare(`
      SELECT id, created_at FROM leads
      WHERE (
        payload_hash = ?
        OR (program = ? AND phone = ? AND lower(full_name) = lower(?) AND julianday(created_at) > julianday('now', '-2 minutes'))
      )
      AND julianday(created_at) > julianday('now', '-10 minutes')
      ORDER BY id DESC
      LIMIT 1
    `).bind(payloadHash, program, phone, fullName).first();

    if (dupCheck) {
      logSecurityEvent({
        action: 'duplicate_replay_detected_db',
        clientIp,
        leadType: program,
        reasons: ['db_program_lead_dedup'],
      });
      return new Response(JSON.stringify({
        success: true,
        duplicate: true,
        leadId: dupCheck.id,
        program,
        status: 'NEW',
        message: 'Đăng ký của bạn đã được ghi nhận.',
      }), { status: 200, headers });
    }

    const phoneRateCheck = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM leads
      WHERE phone = ? AND julianday(created_at) > julianday('now', '-10 minutes')
    `).bind(phone).first();

    if (phoneRateCheck && phoneRateCheck.count >= 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Số điện thoại này đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
      }), { status: 429, headers });
    }
  } catch (dupErr) {
    console.warn('[leads] Program lead duplicate check warning:', dupErr.message);
  }

  // ─── 4. INSERT INTO D1 DATABASE ──────────────────────────────────────
  const createdAt = new Date().toISOString();
  const initialTelegramStatus = spamEval.isSuspicious
    ? 'quarantined'
    : (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? 'pending' : 'not_configured');

  const payloadSnapshot = {
    program,
    full_name: fullName,
    phone,
    email,
    job_title: jobTitle,
    company,
    interest,
    source: rawSource,
    other_source: otherSource,
    privacy_consent: true,
    privacy_consent_at: createdAt,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    marketing_consent: marketingConsent,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    referrer,
    landing_path: landingPath,
  };

  let leadId;
  try {
    const insertRes = await env.DB.prepare(`
      INSERT INTO leads (
        lead_type, program,
        source, other_source, source_page, source_cta,
        name, full_name, email, phone, company, role, job_title, interest,
        privacy_consent, privacy_consent_at, privacy_policy_version, marketing_consent,
        status, notes,
        payload_json,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        referrer, landing_path,
        telegram_status, created_at, updated_at,
        client_ip, spam_score, spam_reasons, payload_hash
      ) VALUES (
        'cafe_talk_registration', ?,
        ?, ?, ?, 'rsvp_form',
        ?, ?, ?, ?, ?, ?, ?, ?,
        1, ?, ?, ?,
        ?, ?,
        ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?
      )
    `).bind(
      program,
      rawSource, otherSource, landingPath,
      fullName, fullName, email || '', phone, company, jobTitle, jobTitle, interest,
      createdAt, PRIVACY_POLICY_VERSION, marketingConsent ? 1 : 0,
      status, notes,
      JSON.stringify(payloadSnapshot),
      utmSource || '', utmMedium || '', utmCampaign || '', utmContent || '', utmTerm || '',
      referrer || '', landingPath,
      initialTelegramStatus, createdAt, createdAt,
      clientIp, spamEval.score, spamEval.reasons.join(','), payloadHash
    ).run();

    if (insertRes.success === false) {
      throw new Error('D1 INSERT returned success=false');
    }
    leadId = insertRes.meta?.last_row_id;
  } catch (dbErr) {
    console.error('[leads] Program lead D1 write error:', dbErr.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Không thể lưu thông tin đăng ký lúc này. Vui lòng thử lại.',
    }), { status: 500, headers });
  }

  // ─── 5. TELEGRAM NOTIFICATION (Non-blocking / Clean Leads Only) ──────
  let telegramStatus = initialTelegramStatus;
  if (spamEval.isClean && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const tgText = formatProgramTelegramMessage({
        program,
        landingPath,
        fullName,
        phone,
        email,
        jobTitle,
        company,
        interest,
        source: rawSource,
        otherSource,
        marketingConsent,
        createdAt,
      });
      const tgRes = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: tgText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
          signal: controller.signal,
        }
      );
      const tgData = await tgRes.json().catch(() => ({}));
      telegramStatus = tgRes.ok && tgData.ok ? 'sent' : 'failed';
    } catch {
      telegramStatus = 'error';
    } finally {
      clearTimeout(timeout);
    }

    try {
      await env.DB.prepare('UPDATE leads SET telegram_status = ? WHERE id = ?')
        .bind(telegramStatus, leadId).run();
    } catch {
      // ignore non-critical status update error
    }
  }

  logSecurityEvent({
    action: spamEval.isSuspicious ? 'lead_quarantined' : 'lead_accepted',
    clientIp,
    leadType: program,
    score: spamEval.score,
    reasons: spamEval.reasons,
    status: 201,
  });

  return new Response(JSON.stringify({
    success: true,
    leadId,
    program,
    status: 'NEW',
    message: 'Đăng ký tham dự đã được ghi nhận thành công.',
  }), { status: 201, headers });
}


