/**
 * POST /api/foundation-leads
 * Dedicated lead capture endpoint for AI Foundation (/ai-foundation)
 * Writes exclusively to the `foundation_leads` D1 table (never mixed with Cafe Talk).
 *
 * Security & Validation:
 * 1. Request headers & body size hardening + IP burst/jail rate limiting
 * 2. Server-side validation of required fields (full_name, phone, privacy_consent)
 * 3. Normalization of phone and email
 * 4. Conditional validation of source / other_source ("Nguồn khác" requires other_source)
 * 5. Spam, script injection, gambling & malicious URL detection
 * 6. Duplicate & double-click replay protection scoped strictly to `foundation_leads`
 * 7. Server-enforced status = 'NEW', notes = '', created_at & privacy_consent_at
 * 8. 100% parameterized D1 prepared statements
 */

import {
  checkRequestHeaders,
  sanitizeField,
  validateEmail,
  validatePhone,
  checkIpRateLimit,
  recordIpFailure,
  computePayloadHash,
  evaluateSpam,
  logSecurityEvent,
} from './_security.js';

const PRIVACY_POLICY_VERSION = '2026-11';

export function normalizeFoundationPhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

function isValidNormalizedPhone(phone) {
  if (!phone || !validatePhone(phone)) return false;
  return /^\+?\d{8,15}$/.test(phone);
}

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

function formatFoundationTelegramMessage(lead) {
  const dt = new Date(lead.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const srcDisplay = lead.source === 'Nguồn khác' && lead.otherSource
    ? `Nguồn khác: ${lead.otherSource}`
    : lead.source;

  return [
    '🎓 <b>[LEAD] ĐĂNG KÝ AI FOUNDATION (18/11/2026)</b>',
    lead.landingPath ? `\nTrang: <code>${esc(lead.landingPath)}</code>` : '',
    '\n──────────────',
    line('Họ tên', lead.fullName),
    line('Điện thoại / Zalo', lead.phone),
    lead.email ? line('Email', lead.email) : '',
    lead.jobTitle ? line('Nghề nghiệp / Chức danh', lead.jobTitle) : '',
    lead.company ? line('Doanh nghiệp', lead.company) : '',
    lead.aiGoal ? line('Mục tiêu ứng dụng AI', lead.aiGoal) : '',
    lead.aiExperience ? line('Mức độ từng dùng AI', lead.aiExperience) : '',
    srcDisplay ? line('Nguồn', srcDisplay) : '',
    `\n<b>Marketing Consent:</b> ${lead.marketingConsent ? '✅ Có' : '❌ Không'}`,
    `\n──────────────`,
    `\n<i>${dt}</i>`,
  ].filter(Boolean).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  const clientIp = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for') ||
                   '127.0.0.1';

  try {
    // ─── 1. REQUEST HEADERS & SIZE HARDENING ────────────────────────────
    const headerCheck = checkRequestHeaders(request);
    if (!headerCheck.ok) {
      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'foundation_header_check_failed',
        clientIp,
        leadType: 'ai_foundation',
        status: headerCheck.status,
        reasons: [headerCheck.error],
      });
      return new Response(JSON.stringify({
        success: false,
        error: headerCheck.error,
      }), { status: headerCheck.status, headers });
    }

    // ─── 2. RATE LIMITING (Burst & Jail) ────────────────────────────────
    const rateCheck = checkIpRateLimit(clientIp);
    if (!rateCheck.allowed) {
      logSecurityEvent({
        action: 'foundation_rate_limited',
        clientIp,
        leadType: 'ai_foundation',
        status: 429,
        reasons: ['ip_burst_or_jail_limit_exceeded'],
      });
      return new Response(JSON.stringify({
        success: false,
        error: rateCheck.error,
      }), {
        status: 429,
        headers: { ...headers, 'Retry-After': String(rateCheck.retryAfter || 60) },
      });
    }

    // ─── 3. PARSE JSON BODY ─────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({
        success: false,
        error: 'Định dạng JSON không hợp lệ.',
      }), { status: 400, headers });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({
        success: false,
        error: 'Dữ liệu gửi lên không đúng định dạng.',
      }), { status: 400, headers });
    }

    if (
      Object.prototype.hasOwnProperty.call(body, '__proto__') ||
      Object.prototype.hasOwnProperty.call(body, 'constructor')
    ) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({
        success: false,
        error: 'Yêu cầu không hợp lệ.',
      }), { status: 400, headers });
    }

    // Honeypot check: silent success if hidden bot field is filled
    if (body.website_url || body.honeypot) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Đăng ký của bạn đã được ghi nhận.',
      }), { status: 200, headers });
    }

    // ─── 4. EXTRACT, SANITIZE & NORMALIZE FIELDS ────────────────────────
    // Strictly ignore any client-supplied status, notes, id, created_at
    const fullName = sanitizeField(body.full_name || body.ho_ten || body.name || '', 100);
    const rawPhone = sanitizeField(body.phone || body.dien_thoai || '', 30);
    const phone = normalizeFoundationPhone(rawPhone);
    const email = sanitizeField(body.email || '', 254).toLowerCase();
    const jobTitle = sanitizeField(
      body.job_title || body.nghe_nghiep || body.chuc_danh || body.role || '',
      150
    );
    const company = sanitizeField(body.company || body.doanh_nghiep || '', 150);
    const aiGoal = sanitizeField(body.ai_goal || body.muc_tieu || '', 1000);
    const aiExperience = sanitizeField(body.ai_experience || body.muc_do || '', 500);

    let rawSource = sanitizeField(body.source || body.nguon_biet_den || '', 120);
    let otherSource = sanitizeField(
      body.other_source || body.nguon_khac || body.nguon_chi_tiet || '',
      200
    );

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
    const landingPath = sanitizeField(body.landing_path || body.sourcePage || '/ai-foundation', 255);

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

    // ─── 5. VALIDATE REQUIRED FIELDS & CONSENT ──────────────────────────
    if (!fullName || fullName.length < 2) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({
        success: false,
        field: 'full_name',
        error: 'Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự).',
      }), { status: 422, headers });
    }

    if (!phone || !isValidNormalizedPhone(phone)) {
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

    // Validate source / other_source
    let source = rawSource;
    if (rawSource === 'Nguồn khác' || rawSource.toLowerCase() === 'nguồn khác') {
      source = 'Nguồn khác';
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
      if (!source) {
        source = utmSource || 'AI Foundation Landing';
      }
    }

    if (!privacyConsent) {
      recordIpFailure(clientIp);
      return new Response(JSON.stringify({
        success: false,
        field: 'privacy_consent',
        error: 'Vui lòng đồng ý Chính sách bảo vệ dữ liệu cá nhân để hoàn tất đăng ký.',
      }), { status: 422, headers });
    }

    // ─── 6. SPAM & MALICIOUS CONTENT EVALUATION ─────────────────────────
    const spamEval = evaluateSpam({
      payload: {
        name: fullName,
        full_name: fullName,
        email,
        phone,
        company,
        role: jobTitle,
        job_title: jobTitle,
        problem: `${aiGoal} ${aiExperience}`,
        message: `${source} ${otherSource}`,
      },
      turnstileResult: { success: true },
    });

    if (spamEval.isBlocked) {
      recordIpFailure(clientIp);
      logSecurityEvent({
        action: 'foundation_spam_blocked',
        clientIp,
        leadType: 'ai_foundation',
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

    // ─── 7. DUPLICATE PROTECTION (SCOPED STRICTLY TO foundation_leads) ──
    const payloadHash = await computePayloadHash({
      leadType: 'AI_FOUNDATION_2026_11_18',
      email,
      phone,
      name: fullName,
      company,
      problem: `${jobTitle}|${aiGoal}|${aiExperience}|${source}|${otherSource}|${marketingConsent ? '1' : '0'}`,
      message: landingPath,
    });

    const marketingConsentInt = marketingConsent ? 1 : 0;

    try {
      const dupCheck = await env.DB.prepare(`
        SELECT id, created_at FROM foundation_leads
        WHERE (
          payload_hash = ?
          OR (
            phone = ?
            AND lower(full_name) = lower(?)
            AND marketing_consent = ?
            AND julianday(created_at) > julianday('now', '-2 minutes')
          )
        )
        AND julianday(created_at) > julianday('now', '-10 minutes')
        ORDER BY id DESC
        LIMIT 1
      `).bind(payloadHash, phone, fullName, marketingConsentInt).first();

      if (dupCheck) {
        logSecurityEvent({
          action: 'foundation_duplicate_replay_detected',
          clientIp,
          leadType: 'ai_foundation',
          reasons: ['db_foundation_lead_dedup'],
        });
        return new Response(JSON.stringify({
          success: true,
          duplicate: true,
          leadId: dupCheck.id,
          status: 'NEW',
          message: 'Đăng ký của bạn đã được ghi nhận.',
        }), { status: 200, headers });
      }

      const phoneRateCheck = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM foundation_leads
        WHERE phone = ? AND julianday(created_at) > julianday('now', '-10 minutes')
      `).bind(phone).first();

      if (phoneRateCheck && phoneRateCheck.count >= 5) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Số điện thoại này đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
        }), { status: 429, headers });
      }

      if (email) {
        const emailRateCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM foundation_leads
          WHERE email = ? AND julianday(created_at) > julianday('now', '-10 minutes')
        `).bind(email).first();

        if (emailRateCheck && emailRateCheck.count >= 5) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Địa chỉ email này đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
          }), { status: 429, headers });
        }
      }
    } catch (dupErr) {
      console.warn('[foundation-leads] Duplicate check warning:', dupErr.message);
    }

    // ─── 8. INSERT INTO foundation_leads (PREPARED STATEMENT) ───────────
    const createdAt = new Date().toISOString();
    const privacyConsentAt = createdAt;
    const status = 'NEW';
    const notes = '';
    const initialTelegramStatus = spamEval.isSuspicious
      ? 'quarantined'
      : (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? 'pending' : 'not_configured');

    const payloadSnapshot = {
      program: 'AI_FOUNDATION_2026_11_18',
      full_name: fullName,
      phone,
      email,
      job_title: jobTitle,
      company,
      ai_goal: aiGoal,
      ai_experience: aiExperience,
      source,
      other_source: otherSource,
      privacy_consent: true,
      privacy_consent_at: privacyConsentAt,
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
        INSERT INTO foundation_leads (
          created_at, updated_at,
          full_name, phone, email, job_title, company,
          ai_goal, ai_experience,
          source, other_source,
          privacy_consent, privacy_consent_at, privacy_policy_version,
          marketing_consent,
          status, notes,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          referrer, landing_path,
          payload_json, payload_hash,
          client_ip, spam_score, spam_reasons, telegram_status
        ) VALUES (
          ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?,
          ?, ?,
          1, ?, ?,
          ?,
          ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?,
          ?, ?,
          ?, ?, ?, ?
        )
      `).bind(
        createdAt, createdAt,
        fullName, phone, email || '', jobTitle || '', company || '',
        aiGoal || '', aiExperience || '',
        source || '', otherSource || '',
        privacyConsentAt, PRIVACY_POLICY_VERSION,
        marketingConsentInt,
        status, notes,
        utmSource || '', utmMedium || '', utmCampaign || '', utmContent || '', utmTerm || '',
        referrer || '', landingPath || '/ai-foundation',
        JSON.stringify(payloadSnapshot), payloadHash,
        clientIp, spamEval.score, spamEval.reasons.join(','), initialTelegramStatus
      ).run();

      if (insertRes.success === false) {
        throw new Error('D1 INSERT returned success=false');
      }
      leadId = insertRes.meta?.last_row_id;
    } catch (dbErr) {
      console.error('[foundation-leads] D1 write error:', dbErr.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Không thể lưu thông tin đăng ký lúc này. Vui lòng thử lại.',
      }), { status: 500, headers });
    }

    // ─── 9. TELEGRAM NOTIFICATION (Clean Leads Only, Non-Blocking) ──────
    let telegramStatus = initialTelegramStatus;
    if (spamEval.isClean && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const tgText = formatFoundationTelegramMessage({
          landingPath,
          fullName,
          phone,
          email,
          jobTitle,
          company,
          aiGoal,
          aiExperience,
          source,
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
        await env.DB.prepare('UPDATE foundation_leads SET telegram_status = ? WHERE id = ?')
          .bind(telegramStatus, leadId).run();
      } catch {
        // ignore non-critical telegram status update error
      }
    }

    logSecurityEvent({
      action: spamEval.isSuspicious ? 'foundation_lead_quarantined' : 'foundation_lead_accepted',
      clientIp,
      leadType: 'ai_foundation',
      score: spamEval.score,
      reasons: spamEval.reasons,
      status: 201,
    });

    return new Response(JSON.stringify({
      success: true,
      leadId,
      status: 'NEW',
      message: 'Đăng ký khóa học AI Foundation đã được ghi nhận thành công.',
    }), { status: 201, headers });

  } catch (err) {
    console.error('[foundation-leads] Unexpected handler error:', err.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.',
    }), { status: 500, headers });
  }
}

export async function onRequestOptions(context) {
  const headers = getCorsHeaders(context.request);
  headers['Access-Control-Max-Age'] = '86400';
  return new Response(null, { status: 204, headers });
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Phương thức không được hỗ trợ. Vui lòng sử dụng POST.',
  }), { status: 405, headers: getCorsHeaders(context.request) });
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
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
