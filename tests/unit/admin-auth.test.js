import { afterEach, describe, expect, it } from 'vitest';
import {
  adminConfigured, checkCredentials, createAdminSession, adminFromToken, signToken, verifyToken,
  createApprovalToken, readApprovalToken, requireAdmin, getCookieValue, sessionCookie, SESSION_COOKIE,
} from '@/lib/admin.js';

const ENV = { ADMIN_EMAIL: 'admin@test.local', ADMIN_PASSWORD: 'correct horse battery staple', ADMIN_SESSION_SECRET: 'test-secret-0123456789abcdef' };
afterEach(() => Object.assign(process.env, ENV));

describe('admin login (regression: empty credentials used to log in)', () => {
  it('is not configured when any variable is missing or the secret is short', () => {
    expect(adminConfigured({})).toBe(false);
    expect(adminConfigured({ ...ENV, ADMIN_PASSWORD: '' })).toBe(false);
    expect(adminConfigured({ ...ENV, ADMIN_SESSION_SECRET: 'short' })).toBe(false);
    expect(adminConfigured(ENV)).toBe(true);
  });

  it('never accepts undefined / empty credentials, even when the env is unset', () => {
    expect(checkCredentials(undefined, undefined, {})).toBe(false);
    expect(checkCredentials('', '', { ADMIN_EMAIL: '', ADMIN_PASSWORD: '' })).toBe(false);
    expect(checkCredentials(undefined, undefined, ENV)).toBe(false);
  });

  it('accepts the right credentials (email case-insensitive) and rejects wrong ones', () => {
    expect(checkCredentials('ADMIN@test.local ', ENV.ADMIN_PASSWORD, ENV)).toBe(true);
    expect(checkCredentials(ENV.ADMIN_EMAIL, 'wrong', ENV)).toBe(false);
    expect(checkCredentials('other@test.local', ENV.ADMIN_PASSWORD, ENV)).toBe(false);
    expect(checkCredentials({}, [], ENV)).toBe(false);
  });
});

describe('signed tokens', () => {
  it('round-trips and rejects tampering, extra parts and expiry', () => {
    const tok = signToken({ type: 'x', exp: Date.now() + 1000 });
    expect(verifyToken(tok)).toMatchObject({ type: 'x' });
    const [data, sig] = tok.split('.');
    const forged = Buffer.from(JSON.stringify({ type: 'admin', exp: Date.now() + 1e9 })).toString('base64url');
    expect(verifyToken(`${forged}.${sig}`)).toBeNull();
    expect(verifyToken(`${data}.${sig}.x`)).toBeNull();
    expect(verifyToken(signToken({ type: 'x', exp: Date.now() - 1 }))).toBeNull();
    expect(verifyToken(signToken({ type: 'x' }))).toBeNull(); // no expiry = invalid
    expect(verifyToken(null)).toBeNull();
  });

  it('does not accept tokens signed with another secret', () => {
    const tok = signToken({ type: 'admin', email: ENV.ADMIN_EMAIL, exp: Date.now() + 1e6 });
    process.env.ADMIN_SESSION_SECRET = 'a-completely-different-secret';
    expect(verifyToken(tok)).toBeNull();
  });

  it('refuses to sign without a proper secret', () => {
    process.env.ADMIN_SESSION_SECRET = '';
    expect(() => signToken({ exp: 1 })).toThrow();
  });
});

describe('admin sessions', () => {
  it('maps a valid session to the admin email only while the admin matches', () => {
    const tok = createAdminSession('Admin@Test.local');
    expect(adminFromToken(tok)).toBe('admin@test.local');
    process.env.ADMIN_EMAIL = 'new-admin@test.local';
    expect(adminFromToken(tok)).toBeNull();
  });

  it('rejects an approval token used as a session', () => {
    expect(adminFromToken(createApprovalToken({ id: 1, email: 'a@b.c' }))).toBeNull();
  });

  it('reads approval tokens with their registration id', () => {
    expect(readApprovalToken(createApprovalToken({ id: 42, email: 'a@b.c' }))).toMatchObject({ rid: 42, email: 'a@b.c' });
    expect(readApprovalToken(createAdminSession(ENV.ADMIN_EMAIL))).toBeNull();
  });
});

describe('requireAdmin', () => {
  const req = (method, headers = {}) => new Request('http://localhost:3000/api/admin/x', { method, headers, body: method === 'GET' ? undefined : '{}' });
  const cookie = () => `${SESSION_COOKIE}=${encodeURIComponent(createAdminSession(ENV.ADMIN_EMAIL))}`;

  it('401s without a session', () => {
    expect(requireAdmin(req('GET')).response.status).toBe(401);
  });
  it('allows GET with a session', () => {
    expect(requireAdmin(req('GET', { cookie: cookie() }))).toEqual({ actor: ENV.ADMIN_EMAIL });
  });
  it('blocks non-JSON and cross-origin mutations (CSRF)', () => {
    expect(requireAdmin(req('POST', { cookie: cookie(), 'content-type': 'text/plain' })).response.status).toBe(415);
    expect(requireAdmin(req('POST', { cookie: cookie(), 'content-type': 'application/json', origin: 'https://evil.example' })).response.status).toBe(403);
    expect(requireAdmin(req('POST', { cookie: cookie(), 'content-type': 'application/json', origin: 'http://localhost:3000' })).actor).toBe(ENV.ADMIN_EMAIL);
  });
  it('builds a strict, http-only cookie and parses cookies', () => {
    expect(sessionCookie('v')).toMatch(/HttpOnly; Path=\/; SameSite=Strict; Max-Age=43200/);
    expect(getCookieValue('a=1; onnopoth_admin=x%3Dy', SESSION_COOKIE)).toBe('x=y');
    expect(getCookieValue(null, SESSION_COOKIE)).toBeNull();
  });
});
