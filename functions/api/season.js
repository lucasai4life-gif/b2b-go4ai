export async function onRequestGet(context) {
  const { env } = context;
  const now = new Date();
  const seasonId = env.SEASON_ID || 'ftc-2026';
  const registrationClosesAt = env.REGISTRATION_CLOSES_AT || '2026-11-30T16:59:59Z';
  const closesAt = new Date(registrationClosesAt);
  const termsVersion = 'the-le-ftc-2026-v1';
  const privacyVersion = 'xu-ly-du-lieu-ftc-2026-v1';

  return new Response(
    JSON.stringify({
      seasonId,
      registrationClosesAt: closesAt.toISOString(),
      registrationOpen: now < closesAt,
      serverTime: now.toISOString(),
      termsVersion,
      privacyVersion,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
