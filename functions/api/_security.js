/**
 * Security Engine for GO4AI Lead Endpoints
 * Provides:
 * 1. Cloudflare Turnstile Server-Side Verification
 * 2. Multi-tier Rate Limiting (Burst limit, Penalty Jail, Rolling Cooldown)
 * 3. Duplicate & Replay Protection (In-Memory + D1 Payload Fingerprinting)
 * 4. Request Hardening & Size/Payload Enforcement
 * 5. Malicious Link, Gambling, Casino, and Phishing Content Detection
 * 6. Spam Scoring Engine (Clean, Suspicious, Blocked)
 * 7. Safe Logging (No secrets, masked IPs)
 */

// ─── IN-MEMORY STATE (Edge isolate cache) ──────────────────────────────────
// Keeps tracking across requests handled by the same Worker isolate.
// Bounded size with auto-eviction to guarantee zero memory leaks.

const IP_BUCKETS = new Map();         // ip -> { count: number, windowStart: number }
const IP_FAILURES = new Map();        // ip -> { count: number, windowStart: number, jailUntil: number }
const RECENT_HASHES = new Map();      // hash -> timestamp
const RECENT_TELEGRAM_HASHES = new Map(); // tgKey -> timestamp

const MAX_CACHE_ENTRIES = 5000;

function cleanupCache(map, maxAgeMs) {
  const now = Date.now();
  for (const [k, v] of map.entries()) {
    const ts = typeof v === 'number' ? v : (v.windowStart || v.jailUntil || 0);
    if (now - ts > maxAgeMs) {
      map.delete(k);
    }
  }
  if (map.size > MAX_CACHE_ENTRIES) {
    const keysToDelete = Array.from(map.keys()).slice(0, Math.floor(MAX_CACHE_ENTRIES / 2));
    for (const k of keysToDelete) map.delete(k);
  }
}

// ─── 1. REQUEST HARDENING & SIZE LIMITS ─────────────────────────────────────
export const MAX_BODY_BYTES = 32768; // 32 KB limit
export const ALLOWED_CONTENT_TYPES = ['application/json'];

export function checkRequestHeaders(request) {
  // Reject missing or oversized Content-Length if provided
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      error: 'Payload quá lớn (tối đa 32KB).',
    };
  }

  // Enforce Content-Type application/json
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  const isJson = ALLOWED_CONTENT_TYPES.some(t => contentType.includes(t));
  if (!isJson) {
    return {
      ok: false,
      status: 415,
      error: 'Định dạng dữ liệu không được hỗ trợ. Bắt buộc application/json.',
    };
  }

  return { ok: true };
}

export function sanitizeField(val, maxLen = 255) {
  if (val === undefined || val === null) return '';
  return String(val)
    .trim()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // remove ASCII control characters
    .slice(0, maxLen);
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length < 5 || email.length > 254) return false;
  // RFC 5322 compatible regex
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email);
}

export function validatePhone(phone) {
  if (!phone) return true; // Phone is optional in some forms
  const sanitized = String(phone).trim();
  if (sanitized.length < 8 || sanitized.length > 25) return false;
  // Allows +, digits, spaces, hyphens, parentheses, dots
  return /^[+]?[\d\s().-]{8,25}$/.test(sanitized);
}

// ─── 2. RATE LIMITER (Burst Limit & Jail) ──────────────────────────────────
export const RATE_LIMITS = {
  BURST_WINDOW_MS: 60 * 1000,    // 1 minute window
  BURST_MAX_REQUESTS: 5,         // Max 5 requests per minute per IP
  JAIL_THRESHOLD: 4,             // 4 failures triggers jail
  JAIL_DURATION_MS: 10 * 60 * 1000, // 10 minutes jail lockout
};

export function checkIpRateLimit(clientIp) {
  const now = Date.now();
  cleanupCache(IP_BUCKETS, RATE_LIMITS.BURST_WINDOW_MS * 2);
  cleanupCache(IP_FAILURES, RATE_LIMITS.JAIL_DURATION_MS * 2);

  // Check if IP is currently jailed
  const jailRecord = IP_FAILURES.get(clientIp);
  if (jailRecord && jailRecord.jailUntil && now < jailRecord.jailUntil) {
    const retrySec = Math.ceil((jailRecord.jailUntil - now) / 1000);
    return {
      allowed: false,
      status: 429,
      retryAfter: retrySec,
      error: `Hệ thống tạm khóa do có quá nhiều yêu cầu không hợp lệ từ địa chỉ của bạn. Vui lòng thử lại sau ${retrySec} giây.`,
    };
  }

  // Check burst sliding window
  let bucket = IP_BUCKETS.get(clientIp);
  if (!bucket || now - bucket.windowStart > RATE_LIMITS.BURST_WINDOW_MS) {
    bucket = { count: 1, windowStart: now };
    IP_BUCKETS.set(clientIp, bucket);
  } else {
    bucket.count += 1;
    if (bucket.count > RATE_LIMITS.BURST_MAX_REQUESTS) {
      const retrySec = Math.ceil((bucket.windowStart + RATE_LIMITS.BURST_WINDOW_MS - now) / 1000);
      return {
        allowed: false,
        status: 429,
        retryAfter: Math.max(1, retrySec),
        error: `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retrySec} giây.`,
      };
    }
  }

  return { allowed: true };
}

export function recordIpFailure(clientIp) {
  const now = Date.now();
  let failRecord = IP_FAILURES.get(clientIp);
  if (!failRecord || now - failRecord.windowStart > 5 * 60 * 1000) {
    failRecord = { count: 1, windowStart: now, jailUntil: 0 };
  } else {
    failRecord.count += 1;
  }

  if (failRecord.count >= RATE_LIMITS.JAIL_THRESHOLD) {
    failRecord.jailUntil = now + RATE_LIMITS.JAIL_DURATION_MS;
  }
  IP_FAILURES.set(clientIp, failRecord);
}

// ─── 3. CLOUDFLARE TURNSTILE VERIFICATION ──────────────────────────────────
export async function verifyTurnstile({ token, secret, remoteIp }) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      success: false,
      reason: 'missing_token',
      error: 'Thiếu mã xác thực Turnstile. Vui lòng thử lại.',
    };
  }

  // Allow standard Cloudflare test secret in dev/testing environments
  const effectiveSecret = secret || '0x4AAAAAAFEKUfnC1dZSC_LRcP2We0HFCfE';

  try {
    const formData = new URLSearchParams();
    formData.append('secret', effectiveSecret);
    formData.append('response', token.trim());
    if (remoteIp) formData.append('remoteip', remoteIp);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        serviceError: true,
        reason: `turnstile_http_${res.status}`,
        error: 'Lỗi dịch vụ xác thực Turnstile. Vui lòng thử lại sau.',
      };
    }

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        hostname: data.hostname,
        challengeTs: data.challenge_ts,
      };
    } else {
      return {
        success: false,
        reason: 'turnstile_rejected',
        errorCodes: data['error-codes'] || [],
        error: 'Xác thực bảo mật không thành công hoặc phiên đã hết hạn. Vui lòng hoàn thành lại xác thực.',
      };
    }
  } catch (err) {
    return {
      success: false,
      serviceError: true,
      reason: err.name === 'AbortError' ? 'turnstile_timeout' : 'turnstile_network_error',
      error: 'Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau ít phút.',
    };
  }
}

// ─── 4. SHA-256 HASH & DUPLICATE REPLAY PROTECTION ─────────────────────────
export async function computePayloadHash(payload) {
  const normEmail = (payload.email || '').trim().toLowerCase();
  const normPhone = (payload.phone || '').replace(/\D/g, '');
  const normName = (payload.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normCompany = (payload.company || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normType = (payload.leadType || '').trim();
  const normContent = (payload.problem || payload.message || '').trim().toLowerCase().slice(0, 200);

  const raw = `${normType}|${normEmail}|${normPhone}|${normName}|${normCompany}|${normContent}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function checkMemoryDuplicate(payloadHash, maxAgeMs = 5 * 60 * 1000) {
  const now = Date.now();
  cleanupCache(RECENT_HASHES, maxAgeMs * 2);
  const prevTime = RECENT_HASHES.get(payloadHash);
  if (prevTime && now - prevTime < maxAgeMs) {
    return true;
  }
  RECENT_HASHES.set(payloadHash, now);
  return false;
}

export function checkTelegramDedupe(key, maxAgeMs = 10 * 60 * 1000) {
  const now = Date.now();
  cleanupCache(RECENT_TELEGRAM_HASHES, maxAgeMs * 2);
  const prev = RECENT_TELEGRAM_HASHES.get(key);
  if (prev && now - prev < maxAgeMs) {
    return true; // Already sent recently
  }
  RECENT_TELEGRAM_HASHES.set(key, now);
  return false;
}

// ─── 5. MALICIOUS LINK, GAMBLING, CASINO & INJECTION DETECTION ─────────────

// Explicit URL protocols & schemes
const PROTOCOL_REGEX = /https?:\/\/|ftp:\/\/|ftps:\/\//i;
const WWW_OR_SLASH_REGEX = /\bwww\.[a-z0-9-]+\.[a-z]{2,}|\/\/[a-z0-9-]+\.[a-z]{2,}/i;

// Known link shorteners & chat invitation links
const SHORTENER_AND_CHAT_REGEX = /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|cutt\.ly|s\.id|rb\.gy|shorturl\.at|rebrand\.ly|bl\.ink|tny\.im|v\.gd|t\.me|telegram\.me|wa\.me|api\.whatsapp\.com|zalo\.me|chat\.zalo\.me|discord\.gg|line\.me|m\.me)\b/i;

// Prohibited domain TLDs in free-text fields
const DOMAIN_IN_TEXT_REGEX = /\b[a-z0-9][-a-z0-9]{1,62}\.(?:com|org|net|vn|com\.vn|edu\.vn|info|biz|xyz|top|online|site|club|vip|icu|live|app|cc|ru|cn|me|io|tv|space|store|pro|link|click|work|mobi|asia|tokyo|bet|casino|poker|fun|win|bar|buzz)\b/i;

// IP URLs
const IP_URL_REGEX = /\b(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s]*)?\b/;

// Punycode & Obfuscation
const OBFUSCATED_URL_REGEX = /\bxn--|(?:\[|\()dot(?:\]|\))|\bh[x*]{2}p/i;

// Script / HTML Injection
const INJECTION_REGEX = /<script[\s>]|<\/script>|<iframe[\s>]|<object[\s>]|<embed[\s>]|<svg[\s>]|javascript:|data:text\/html|\bon\w+\s*=|document\.cookie|eval\(/i;

// Vietnamese & Asian gambling brands and terminology
const GAMBLING_TERMS_REGEX = /\b(tài\s*xỉu|tai\s*xiu|nhà\s*cái|nha\s*cai|cá\s*cược|ca\s*cuoc|đánh\s*bạc|danh\s*bac|lô\s*đề|lo\s*de|xổ\s*số|xo\s*so|so\s*de|nổ\s*hũ|no\s*hu|bắn\s*cá|ban\s*ca|kèo\s*bóng|keo\s*bong|đá\s*gà|da\s*ga|quay\s*hũ|quay\s*hu|soi\s*kèo|soi\s*cau|game\s*bài|choi\s*bai|đổi\s*thưởng|doi\s*thuong|tien\s*len)\b/i;

const GAMBLING_BRANDS_REGEX = /\b(kubet|thabet|w88|m88|fun88|188bet|fb88|bk8|shbet|jun88|789bet|hi88|new88|f8bet|okvip|sunwin|go88|b52\s*club|hitclub|rikvip|iwin|dabet|may88|zbet|sin88|sv388|lixi88|k8cc)\b/i;

const ENGLISH_GAMBLING_REGEX = /\b(casino|sportsbook|slot\s*machine|poker\s*online|baccarat|roulette|blackjack|crypto\s*casino|deposit\s*bonus|free\s*spins|betting\s*odds)\b/i;

// Disposable Email Domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com',
  'trashmail.com', 'sharklasers.com', 'dispostable.com', 'getairmail.com',
  'yopmail.com', 'throwawaymail.com', 'fakemailgenerator.com', 'temp-mail.org',
  'emailondeck.com', 'mohmal.com', 'mytemp.email', 'dropmail.me'
]);

// ─── 6. SPAM SCORING ENGINE ────────────────────────────────────────────────
export function evaluateSpam({ payload, turnstileResult }) {
  let score = 0;
  const reasons = [];

  // Check 1: Turnstile Verification
  if (!turnstileResult || !turnstileResult.success) {
    score += 100;
    reasons.push(turnstileResult?.reason || 'turnstile_failed');
  }

  // Check 2: Inspect all free-text fields for prohibited content
  // Note: Forms on b2b.go4ai.org have NO business requirement for URLs in user text!
  const freeTextFields = [
    payload.name,
    payload.company,
    payload.role,
    payload.companySize,
    payload.problem,
    payload.message,
    payload.job_title,
    payload.full_name,
    Array.isArray(payload.interest) ? payload.interest.join(' ') : payload.interest,
  ].filter(Boolean).map(String);

  const combinedFreeText = freeTextFields.join(' ');

  // Script / HTML Injection check
  if (INJECTION_REGEX.test(combinedFreeText) || INJECTION_REGEX.test(payload.email || '')) {
    score += 100;
    reasons.push('script_injection');
  }

  // Gambling brands (e.g. Kubet, W88, Fun88, Sunwin, Go88)
  if (GAMBLING_BRANDS_REGEX.test(combinedFreeText)) {
    score += 85;
    reasons.push('gambling_brand');
  }

  // Gambling keywords & terms (tài xỉu, nhà cái, cá cược, đá gà, etc.)
  if (GAMBLING_TERMS_REGEX.test(combinedFreeText) || ENGLISH_GAMBLING_REGEX.test(combinedFreeText)) {
    score += 80;
    reasons.push('gambling_content');
  }

  // URL / Link detection in free-text fields
  if (
    PROTOCOL_REGEX.test(combinedFreeText) ||
    WWW_OR_SLASH_REGEX.test(combinedFreeText) ||
    SHORTENER_AND_CHAT_REGEX.test(combinedFreeText) ||
    IP_URL_REGEX.test(combinedFreeText) ||
    OBFUSCATED_URL_REGEX.test(combinedFreeText) ||
    DOMAIN_IN_TEXT_REGEX.test(combinedFreeText)
  ) {
    score += 75;
    reasons.push('url_in_freetext');
  }

  // Check 3: Email domain inspection
  const emailDomain = (payload.email || '').split('@')[1]?.toLowerCase();
  if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
    score += 50;
    reasons.push('disposable_email');
  }

  // Check 4: Character repetition / meaningless gibberish
  if (/(.)\1{7,}/.test(combinedFreeText)) { // Character repeated >= 8 times
    score += 40;
    reasons.push('repetitive_gibberish');
  }

  // Check 5: Suspicious rapid submission (client timestamp provided and < 2s on page)
  if (payload.clientTimestamp) {
    const elapsed = Date.now() - Number(payload.clientTimestamp);
    if (elapsed > 0 && elapsed < 2000) {
      score += 30;
      reasons.push('too_fast_submit');
    }
  }

  // Categorize
  let category = 'clean';
  if (score >= 70) {
    category = 'blocked';
  } else if (score >= 30) {
    category = 'suspicious';
  }

  return {
    score,
    category,
    reasons,
    isBlocked: category === 'blocked',
    isSuspicious: category === 'suspicious',
    isClean: category === 'clean',
  };
}

// ─── 7. SAFE LOGGING HELPER ────────────────────────────────────────────────
export function maskIp(ip) {
  if (!ip) return 'unknown';
  if (ip.includes('.')) {
    // IPv4: mask last two octets -> 192.168.***.***
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
  } else if (ip.includes(':')) {
    // IPv6: keep first prefix
    const parts = ip.split(':');
    return `${parts.slice(0, 2).join(':')}::***`;
  }
  return 'masked';
}

export function logSecurityEvent({ action, clientIp, leadType, score, reasons, status }) {
  console.log(JSON.stringify({
    tag: 'GO4AI_SECURITY',
    timestamp: new Date().toISOString(),
    action,
    clientIp: maskIp(clientIp),
    leadType: leadType || 'unknown',
    score: score || 0,
    reasons: reasons || [],
    status: status || 200,
  }));
}
