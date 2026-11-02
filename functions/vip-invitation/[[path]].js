/**
 * Cloudflare Pages Function — Scoped Subpath Gateway for GO4AI VIP Invitation Studio
 * Routes ONLY /vip-invitation and /vip-invitation/* to the dedicated Worker
 * `go4ai-vip-invitation-prod` via Cloudflare Service Binding (`env.VIP_INVITATION`).
 *
 * Isolation guarantee:
 * - Only invoked by Cloudflare Pages for requests matching /vip-invitation or /vip-invitation/*
 * - Does not touch any B2B static pages, assets, or /api/leads
 */
export async function onRequest(context) {
  const { request, env } = context;

  if (!env || !env.VIP_INVITATION || typeof env.VIP_INVITATION.fetch !== 'function') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'SERVICE_BINDING_UNAVAILABLE',
          message: 'Service binding VIP_INVITATION -> go4ai-vip-invitation-prod is not bound.'
        }
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  return await env.VIP_INVITATION.fetch(request);
}
