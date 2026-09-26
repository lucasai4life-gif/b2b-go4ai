/**
 * POST /api/leads
 * Unified lead capture for b2b.go4ai.org
 * Handles both enterprise consultation (Form A) and Claude workshop registration (Form B)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://b2b.go4ai.org',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  // Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers,
    });
  }

  // ─── VALIDATE REQUIRED FIELDS ────────────────────────────────────────
  const name  = sanitize(body.name,  120);
  const email = sanitize(body.email, 320);
  const leadType   = sanitize(body.leadType,   64);
  const source     = sanitize(body.source,     64);
  const sourcePage = sanitize(body.sourcePage, 255);
  const sourceCta  = sanitize(body.sourceCta,  255);

  if (!email || !validateEmail(email)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid email address' }), {
      status: 422,
      headers,
    });
  }

  if (!leadType || !['enterprise_consultation', 'claude_workshop_registration'].includes(leadType)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid leadType' }), {
      status: 422,
      headers,
    });
  }

  // ─── BUILD RECORD ────────────────────────────────────────────────────
  const phone   = sanitize(body.phone,   64);
  const company = sanitize(body.company, 255);
  const role    = sanitize(body.role,    128);

  // UTM + referrer
  const utmSource   = sanitize(body.utm_source,   128);
  const utmMedium   = sanitize(body.utm_medium,   128);
  const utmCampaign = sanitize(body.utm_campaign, 128);
  const utmContent  = sanitize(body.utm_content,  255);
  const referrer    = sanitize(body.referrer,      512);

  // All extra form-specific fields go into payload_json
  const payloadExtra = {};
  const allowedExtra = [
    'companySize', 'interest', 'problem', 'privacyConsent',
    'aiLevel', 'mostInterested', 'intent', 'job_title',
    'program', 'message', 'full_name'
  ];
  for (const k of allowedExtra) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
      payloadExtra[k] = typeof body[k] === 'string' ? sanitize(body[k], 2000) : body[k];
    }
  }

  const createdAt = new Date().toISOString();

  // ─── WRITE TO D1 ────────────────────────────────────────────────────
  let leadId;
  try {
    const result = await env.DB.prepare(`
      INSERT INTO leads (
        lead_type, source, source_page, source_cta,
        name, email, phone, company, role,
        payload_json,
        utm_source, utm_medium, utm_campaign, utm_content,
        referrer, telegram_status, created_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, 'pending', ?
      )
    `).bind(
      leadType, source, sourcePage || '', sourceCta || '',
      name || '', email, phone || '', company || '', role || '',
      JSON.stringify(payloadExtra),
      utmSource || null, utmMedium || null, utmCampaign || null, utmContent || null,
      referrer || null, createdAt
    ).run();

    leadId = result.meta?.last_row_id;
  } catch (dbErr) {
    console.error('[leads] D1 write error:', dbErr.message);
    return new Response(JSON.stringify({ success: false, error: 'Database error. Please try again.' }), {
      status: 500,
      headers,
    });
  }

  // ─── SEND TELEGRAM NOTIFICATION ─────────────────────────────────────
  // Telegram failure must NOT block lead save success
  let telegramStatus = 'skipped';
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId   = env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    try {
      const message = buildTelegramMessage({
        leadType, source, sourcePage, sourceCta,
        name, email, phone, company, role,
        payloadExtra, createdAt
      });

      const tgRes = await fetch(
        `https://api.telegram.org/bot\${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          })
        }
      );

      const tgData = await tgRes.json();
      telegramStatus = tgData.ok ? 'sent' : 'failed';

      // Update telegram_status in D1
      if (leadId) {
        await env.DB.prepare(
          `UPDATE leads SET telegram_status = ? WHERE id = ?`
        ).bind(telegramStatus, leadId).run().catch(() => {});
      }
    } catch (tgErr) {
      console.error('[leads] Telegram error:', tgErr.message);
      telegramStatus = 'error';
    }
  }

  return new Response(JSON.stringify({ success: true, leadId, telegramStatus }), {
    status: 201,
    headers,
  });
}

// Handle OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://b2b.go4ai.org',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────
function sanitize(val, maxLen) {
  if (val === undefined || val === null) return '';
  return String(val).trim().slice(0, maxLen);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function esc(val) {
  // HTML escape for Telegram HTML mode
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function line(label, val) {
  if (!val || String(val).trim() === '') return '';
  return `\n<b>\${esc(label)}:</b> \${esc(val)}`;
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
      `\n<i>\${dt}</i>`,
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
      `\nTrang: /claude/`,
      `\n──────────────`,
      `\n<i>\${dt}</i>`,
    ].filter(Boolean).join('');
  }

  // Generic fallback
  return `📋 <b>NEW LEAD</b>\nType: \${esc(leadType)}\nSource: \${esc(source)}\nEmail: \${esc(email)}\n<i>\${dt}</i>`;
}
