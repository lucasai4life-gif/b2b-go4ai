// A short-lived capability for updating only the workshop row just created.
async function signingKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(`claude-opportunity-v1:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function claim(lead, issuedAt) {
  return `${lead.id}|${lead.email}|${lead.created_at}|${issuedAt}`;
}

export async function issueOpportunityToken(secret, lead) {
  const issuedAt = Date.now();
  const key = await signingKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(claim(lead, issuedAt)));
  const hex = [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${issuedAt}.${hex}`;
}

export async function verifyOpportunityToken(secret, lead, token) {
  if (!secret || typeof token !== 'string' || !/^\d{13}\.[0-9a-f]{64}$/.test(token)) return false;
  const [issuedRaw, hex] = token.split('.');
  const issuedAt = Number(issuedRaw);
  if (issuedAt > Date.now() + 60_000 || Date.now() - issuedAt > 86_400_000) return false;
  const signature = new Uint8Array(hex.match(/../g).map(b => parseInt(b, 16)));
  const key = await signingKey(secret);
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(claim(lead, issuedAt)));
}
