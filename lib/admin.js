/**
 * Admin authentication and signed links.
 *
 * - Admin login is disabled (never "open") unless ADMIN_EMAIL, ADMIN_PASSWORD
 *   and ADMIN_SESSION_SECRET are all set.
 * - Credentials are compared in constant time.
 * - Sessions and approval links are HMAC-signed; approval links name the
 *   registration they belong to.
 */
import crypto from 'node:crypto';
import { dates } from './config.js';

export const SESSION_COOKIE = 'onnopoth_admin';
const SESSION_MS = 12 * 60 * 60 * 1000;

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET || '';
  if (s.length < 16) throw new Error('ADMIN_SESSION_SECRET must be set (at least 16 characters).');
  return s;
}

export function adminConfigured(env = process.env) {
  return Boolean(env.ADMIN_EMAIL && env.ADMIN_PASSWORD && (env.ADMIN_SESSION_SECRET || '').length >= 16);
}

/** Constant-time string comparison (hashes first so lengths don't leak). */
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a ?? '')).digest();
  const hb = crypto.createHash('sha256').update(String(b ?? '')).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkCredentials(email, password, env = process.env) {
  if (!adminConfigured(env)) return false;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) return false;
  // Evaluate both so timing doesn't reveal which one was wrong.
  const okEmail = safeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL.trim().toLowerCase());
  const okPass = safeEqual(password, env.ADMIN_PASSWORD);
  return okEmail && okPass;
}

export function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string' || token.length > 4096) return null;
  try {
    const [data, sig, extra] = token.split('.');
    if (!data || !sig || extra !== undefined) return null;
    const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createAdminSession(email) {
  return signToken({ type: 'admin', email: email.trim().toLowerCase(), exp: Date.now() + SESSION_MS });
}

/** Returns the admin email for a valid session token, else null. */
export function adminFromToken(token) {
  if (!adminConfigured()) return null;
  const p = verifyToken(token);
  if (!p || p.type !== 'admin') return null;
  return safeEqual(p.email, process.env.ADMIN_EMAIL.trim().toLowerCase()) ? p.email : null;
}

/** Approval link token: tied to one registration, valid until submissions close. */
export function createApprovalToken(registration) {
  return signToken({
    type: 'approval',
    rid: registration.id,
    email: registration.email,
    exp: new Date(dates.competitionEnd).getTime(),
  });
}

export function readApprovalToken(token) {
  const p = verifyToken(token);
  return p && p.type === 'approval' && Number.isInteger(p.rid) ? p : null;
}

export function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function sessionCookie(value, { maxAge = SESSION_MS / 1000 } = {}) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

const json = (body, status) => Response.json(body, { status });

/**
 * Guard for admin API routes. Returns { actor } or { response } to return as-is.
 * Mutating requests must be JSON and same-origin (blocks cross-site form posts).
 */
export function requireAdmin(req) {
  const actor = adminFromToken(getCookieValue(req.headers.get('cookie'), SESSION_COOKIE));
  if (!actor) return { response: json({ error: 'অনুমোদন প্রয়োজন। আবার লগইন করুন।' }, 401) };
  if (req.method !== 'GET') {
    if (!(req.headers.get('content-type') || '').includes('application/json')) {
      return { response: json({ error: 'অনুরোধটি সঠিক নয়।' }, 415) };
    }
    const origin = req.headers.get('origin');
    if (origin && new URL(origin).host !== new URL(req.url).host) {
      return { response: json({ error: 'অনুরোধটি সঠিক নয়।' }, 403) };
    }
  }
  return { actor };
}

export function submitLink(registration, siteUrl) {
  return `${siteUrl}/submit?token=${encodeURIComponent(createApprovalToken(registration))}`;
}
