/** Update the same workshop lead after a successful registration. */
import { sanitizeField } from './_security.js';
import { verifyOpportunityToken } from './_opportunity-token.js';

const ROUTES = Object.freeze({
  LEARN: 'MEMBER_10M', EARN: 'PRO_30M',
  BUILD: 'STRATEGIC_100M', PARTNER: 'STRATEGIC_PARTNER',
});
const ROLES = ['Sinh viên / mới đi làm', 'Người đi làm / chuyên viên', 'Freelancer / Trainer / Consultant', 'Quản lý', 'Founder / Chủ doanh nghiệp / CEO'];
const GOALS = ['Nâng cấp năng lực AI', 'Cơ hội nghề nghiệp', 'Project / nguồn thu nhập mới', 'Phát triển doanh nghiệp', 'Xây sản phẩm / giải pháp AI', 'Mở rộng khách hàng / partnership'];
const TIMELINES = ['Ngay', 'Trong 1 tháng', 'Trong 1–3 tháng', 'Đang tìm hiểu'];

const reply = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export async function onRequestPost({ request, env }) {
  if (!env.DB) return reply({ success: false, error: 'Cơ sở dữ liệu chưa sẵn sàng.' }, 503);
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ success: false, error: 'Định dạng không hợp lệ.' }, 415);
  if (Number(request.headers.get('content-length') || 0) > 4096) return reply({ success: false, error: 'Dữ liệu quá lớn.' }, 413);
  let body;
  try { body = await request.json(); } catch { return reply({ success: false, error: 'JSON không hợp lệ.' }, 400); }
  const leadId = Number(body?.leadId);
  const token = typeof body?.opportunityToken === 'string' ? body.opportunityToken : '';
  const type = sanitizeField(body?.opportunityType, 20);
  const role = sanitizeField(body?.currentRole, 100);
  const goal = sanitizeField(body?.primaryGoal, 100);
  const timeline = sanitizeField(body?.startTimeline, 50);
  if (!Number.isSafeInteger(leadId) || leadId < 1 || !/^\d{13}\.[0-9a-f]{64}$/.test(token) ||
      !Object.hasOwn(ROUTES, type) || !ROLES.includes(role) || !GOALS.includes(goal) || !TIMELINES.includes(timeline)) {
    return reply({ success: false, error: 'Vui lòng kiểm tra lựa chọn của bạn.' }, 422);
  }
  try {
    const lead = await env.DB.prepare(`SELECT id, email, created_at, name, phone, spam_score
      FROM leads WHERE id = ? AND lead_type = 'claude_workshop_registration'`).bind(leadId).first();
    if (!lead || !await verifyOpportunityToken(env.TURNSTILE_SECRET_KEY, lead, token)) {
      return reply({ success: false, error: 'Phiên đăng ký không hợp lệ hoặc đã hết hạn.' }, 403);
    }
    const result = await env.DB.prepare(`UPDATE leads SET payload_json=json_set(
      COALESCE(NULLIF(payload_json,''),'{}'),
      '$.opportunity_type', ?, '$.current_role', ?, '$.primary_goal', ?,
      '$.start_timeline', ?, '$.sales_route', ?, '$.opportunity_updated_at', ?)
      WHERE id=? AND lead_type='claude_workshop_registration'
      AND json_extract(COALESCE(NULLIF(payload_json,''),'{}'),'$.opportunity_type') IS NULL`)
      .bind(type, role, goal, timeline, ROUTES[type], new Date().toISOString(), leadId).run();
    if (result.meta?.changes !== 1) return reply({ success: false, error: 'Phiên đăng ký đã hết hạn hoặc lựa chọn đã được lưu.' }, 409);
    // Notify sales only after D1 confirms the update. A notification failure never rolls back the lead.
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      try {
      if (lead && Number(lead.spam_score || 0) < 40) {
        const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const message = `<b>CLAUDE OPPORTUNITY</b>\nLead #${leadId}\n${esc(lead.name)} · ${esc(lead.phone)} · ${esc(lead.email)}\nHướng: ${esc(type)} → ${esc(ROUTES[type])}\nVai trò: ${esc(role)}\nMục tiêu: ${esc(goal)}\nThời điểm: ${esc(timeline)}`;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' }),
              signal: controller.signal,
            });
          } finally { clearTimeout(timeout); }
        } catch (error) { console.error('[lead-opportunity] Telegram error:', error.message); }
      }
      } catch (error) { console.error('[lead-opportunity] Telegram read error:', error.message); }
    }
    return reply({ success: true, leadId, opportunityType: type });
  } catch (error) {
    console.error('[lead-opportunity] D1 update error:', error.message);
    return reply({ success: false, error: 'Chưa lưu được lựa chọn. Vui lòng thử lại.' }, 500);
  }
}

export function onRequestGet() { return reply({ success: false }, 405); }
