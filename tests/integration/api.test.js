/**
 * End-to-end through the real route handlers and a real (throwaway) Postgres
 * schema. Email goes to an in-process SMTP sink, so we can assert on it.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestSchema, dropTestSchema } from '../helpers/schema.js';
import { startSmtpSink } from '../helpers/smtp-sink.js';
import { registrationBody, submissionBody, request } from '../helpers/fixtures.js';
import { closeSql, getSql, t } from '@/lib/db.js';
import { dates } from '@/lib/config.js';

import * as register from '@/app/api/register/route.js';
import * as status from '@/app/api/status/route.js';
import * as access from '@/app/api/submit/access/route.js';
import * as submit from '@/app/api/submit/route.js';
import * as login from '@/app/api/admin/login/route.js';
import * as data from '@/app/api/admin/data/route.js';
import * as decision from '@/app/api/admin/decision/route.js';
import * as resend from '@/app/api/admin/resend/route.js';
import * as linkRoute from '@/app/api/admin/link/route.js';
import * as remind from '@/app/api/admin/remind/route.js';
import * as score from '@/app/api/admin/score/route.js';
import * as results from '@/app/api/admin/results/route.js';
import * as exportRoute from '@/app/api/admin/export/route.js';

let schema;
let sink;
let cookie;
const DURING_REGISTRATION = new Date(new Date(dates.registrationDeadline).getTime() - 86400000);
const DURING_BUILD = new Date(new Date(dates.competitionStart).getTime() + 3600000);
const AFTER_DEADLINE = new Date(new Date(dates.competitionEnd).getTime() + 60000);

beforeAll(async () => {
  schema = await createTestSchema();
  sink = await startSmtpSink();
});
afterAll(async () => {
  await sink.stop();
  await dropTestSchema(schema);
  await closeSql();
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(DURING_REGISTRATION);
});
afterEach(() => {
  vi.useRealTimers();
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM', 'SMTP_SECURE', 'RECEIVER_EMAIL']) delete process.env[k];
  sink.clear();
});

const body = async (res) => res.json();
const adminPost = (path, payload, extra = {}) => request(path, { method: 'POST', body: payload, cookie, ...extra });
const emailLog = (registrationId) => getSql()`select kind, status from ${t('email_log')} where registration_id = ${registrationId} order by id`;
const registrationByEmail = async (email) => (await getSql()`select * from ${t('registrations')} where email = ${email}`)[0];

async function registered(overrides) {
  const b = registrationBody(overrides);
  const res = await register.POST(request('/api/register', { method: 'POST', body: b }));
  expect(res.status).toBe(200);
  return { body: b, row: await registrationByEmail(b.email) };
}

async function signIn() {
  const res = await login.POST(request('/api/admin/login', { method: 'POST', body: { email: 'admin@test.local', password: 'correct horse battery staple' } }));
  expect(res.status).toBe(200);
  cookie = res.headers.get('set-cookie').split(';')[0];
}

// ------------------------------------------------------------------ public

describe('POST /api/register', () => {
  it('saves the registration even without email settings, and logs the skipped email', async () => {
    const b = registrationBody();
    const res = await register.POST(request('/api/register', { method: 'POST', body: b }));
    expect(res.status).toBe(200);
    expect(await body(res)).toEqual({ ok: true, emailed: false });
    const row = await registrationByEmail(b.email);
    expect(row).toMatchObject({ status: 'pending', fullName: b.fullName });
    expect(await emailLog(row.id)).toEqual([{ kind: 'registration-confirmation', status: 'skipped' }]);
  });

  it('emails the participant (with calendar file) and the organizer when SMTP is set', async () => {
    sink.use();
    process.env.RECEIVER_EMAIL = 'organizer@test.local';
    const b = registrationBody();
    const res = await register.POST(request('/api/register', { method: 'POST', body: b }));
    expect(await body(res)).toEqual({ ok: true, emailed: true });
    expect(sink.messages.map((m) => m.to[0]).sort()).toEqual([b.email, 'organizer@test.local'].sort());
    const confirmation = sink.messages.find((m) => m.to[0] === b.email);
    expect(confirmation.subject).toBe('আপনার রেজিস্ট্রেশন গ্রহণ করা হয়েছে');
    expect(confirmation.raw).toContain('onnopoth-competition.ics');
  });

  it('rejects a duplicate email (any case) with a field error', async () => {
    const { body: b } = await registered();
    const res = await register.POST(request('/api/register', { method: 'POST', body: { ...b, email: b.email.toUpperCase() } }));
    expect(res.status).toBe(409);
    expect((await body(res)).fields).toHaveProperty('email');
  });

  it('returns field errors for invalid input', async () => {
    const res = await register.POST(request('/api/register', { method: 'POST', body: registrationBody({ whatsapp: '123', email: 'x' }) }));
    expect(res.status).toBe(400);
    expect(Object.keys((await body(res)).fields).sort()).toEqual(['email', 'whatsapp']);
  });

  it('silently drops honeypot submissions', async () => {
    const b = registrationBody({ website: 'http://spam' });
    expect((await register.POST(request('/api/register', { method: 'POST', body: b }))).status).toBe(200);
    expect(await registrationByEmail(b.email)).toBeUndefined();
  });

  it('closes after the deadline', async () => {
    vi.setSystemTime(new Date(new Date(dates.registrationDeadline).getTime() + 1000));
    expect((await register.POST(request('/api/register', { method: 'POST', body: registrationBody() }))).status).toBe(403);
  });

  it('rate-limits one IP to five registrations per ten minutes', async () => {
    const ipAddress = '203.0.113.77';
    for (let i = 0; i < 5; i++) {
      expect((await register.POST(request('/api/register', { method: 'POST', body: registrationBody(), ipAddress }))).status).toBe(200);
    }
    expect((await register.POST(request('/api/register', { method: 'POST', body: registrationBody(), ipAddress }))).status).toBe(429);
  });

  it('rejects a malformed body', async () => {
    const res = await register.POST(new Request('http://localhost:3000/api/register', { method: 'POST', body: '{not json' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/status', () => {
  it('needs both email and WhatsApp to match', async () => {
    const { body: b } = await registered();
    const ok = await body(await status.POST(request('/api/status', { method: 'POST', body: { email: b.email.toUpperCase(), whatsapp: b.whatsapp } })));
    expect(ok).toMatchObject({ status: 'pending', name: b.fullName, productName: b.productName });
    const miss = await body(await status.POST(request('/api/status', { method: 'POST', body: { email: b.email, whatsapp: '01900000000' } })));
    expect(miss).toEqual({ status: 'not-found' });
    expect((await status.POST(request('/api/status', { method: 'POST', body: {} }))).status).toBe(400);
  });
});

// ------------------------------------------------------------------ admin auth

describe('admin login', () => {
  it('is disabled (503) when admin env is missing — the old empty-body bypass', async () => {
    const saved = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    const res = await login.POST(request('/api/admin/login', { method: 'POST', body: {} }));
    process.env.ADMIN_PASSWORD = saved;
    expect(res.status).toBe(503);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('rejects an empty body and wrong passwords', async () => {
    expect((await login.POST(request('/api/admin/login', { method: 'POST', body: {} }))).status).toBe(401);
    expect((await login.POST(request('/api/admin/login', { method: 'POST', body: { email: 'admin@test.local', password: 'nope' } }))).status).toBe(401);
  });

  it('locks an IP out after five failures, even with the right password', async () => {
    const ipAddress = '198.51.100.9';
    for (let i = 0; i < 5; i++) {
      await login.POST(request('/api/admin/login', { method: 'POST', body: { email: 'admin@test.local', password: 'bad' }, ipAddress }));
    }
    const res = await login.POST(request('/api/admin/login', { method: 'POST', body: { email: 'admin@test.local', password: 'correct horse battery staple' }, ipAddress }));
    expect(res.status).toBe(429);
  });

  it('sets a strict, http-only session cookie on success', async () => {
    const res = await login.POST(request('/api/admin/login', { method: 'POST', body: { email: 'ADMIN@test.local', password: 'correct horse battery staple' } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toMatch(/onnopoth_admin=.+; HttpOnly; Path=\/; SameSite=Strict/);
  });

  it('protects every admin route', async () => {
    const anon = (mod, path) => mod.POST(request(path, { method: 'POST', body: {} }));
    expect((await data.GET(request('/api/admin/data'))).status).toBe(401);
    expect((await exportRoute.GET(request('/api/admin/export?type=registrations'))).status).toBe(401);
    for (const [mod, path] of [[decision, '/api/admin/decision'], [resend, '/api/admin/resend'], [linkRoute, '/api/admin/link'], [remind, '/api/admin/remind'], [score, '/api/admin/score'], [results, '/api/admin/results']]) {
      expect((await anon(mod, path)).status, path).toBe(401);
    }
  });
});

// ------------------------------------------------------------------ the organizer workflow

describe('organizer workflow', () => {
  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(DURING_REGISTRATION);
    await signIn();
    vi.useRealTimers();
  });

  it('lists registrations with stats and email setup state', async () => {
    const { row } = await registered();
    const d = await body(await data.GET(request('/api/admin/data', { cookie })));
    expect(d.me).toBe('admin@test.local');
    expect(d.emailConfigured).toBe(false);
    expect(d.registrations.find((r) => r.id === row.id)).toMatchObject({ status: 'pending', submissionId: null, decisionEmail: null });
    expect(d.stats.total).toBe(d.registrations.length);
  });

  it('approves, emails a personal link, and shows up on the status page', async () => {
    sink.use();
    const { row, body: b } = await registered();
    sink.clear();
    const res = await decision.POST(adminPost('/api/admin/decision', { id: row.id, decision: 'approved', note: 'Keep it small' }));
    const out = await body(res);
    expect(out).toMatchObject({ ok: true, previousStatus: 'pending', email: { status: 'sent' }, registration: { status: 'approved', decisionNote: 'Keep it small', decidedBy: 'admin@test.local' } });
    expect(sink.messages).toHaveLength(1);
    expect(sink.messages[0].text).toMatch(/submit\?token=/);
    expect(sink.messages[0].text).toContain('Keep it small');

    const st = await body(await status.POST(request('/api/status', { method: 'POST', body: { email: b.email, whatsapp: b.whatsapp } })));
    expect(st.status).toBe('approved');

    // Same decision again: nothing new is emailed.
    sink.clear();
    const again = await body(await decision.POST(adminPost('/api/admin/decision', { id: row.id, decision: 'approved' })));
    expect(again.email.status).toBe('skipped');
    expect(sink.messages).toHaveLength(0);
  });

  it('undo (back to pending) never emails; decline sends the decline email', async () => {
    sink.use();
    const { row } = await registered();
    await decision.POST(adminPost('/api/admin/decision', { id: row.id, decision: 'declined', notify: false }));
    expect(sink.messages.filter((m) => m.subject.startsWith('আইডিয়া আপডেট'))).toHaveLength(0);
    const undo = await body(await decision.POST(adminPost('/api/admin/decision', { id: row.id, decision: 'pending' })));
    expect(undo).toMatchObject({ previousStatus: 'declined', registration: { status: 'pending', decidedAt: null } });
    sink.clear();
    await decision.POST(adminPost('/api/admin/decision', { id: row.id, decision: 'declined' }));
    expect(sink.messages.map((m) => m.subject)).toEqual([expect.stringMatching(/^আইডিয়া আপডেট/)]);
  });

  it('validates decision input and blocks CSRF-style requests', async () => {
    expect((await decision.POST(adminPost('/api/admin/decision', { id: 'x', decision: 'approved' }))).status).toBe(400);
    expect((await decision.POST(adminPost('/api/admin/decision', { id: 1, decision: 'maybe' }))).status).toBe(400);
    expect((await decision.POST(adminPost('/api/admin/decision', { id: 99999999, decision: 'approved' }))).status).toBe(404);
    const plain = request('/api/admin/decision', { method: 'POST', body: { id: 1, decision: 'approved' }, cookie, headers: { 'content-type': 'text/plain' } });
    expect((await decision.POST(plain)).status).toBe(415);
    const cross = adminPost('/api/admin/decision', { id: 1, decision: 'approved' }, { headers: { origin: 'https://evil.example' } });
    expect((await decision.POST(cross)).status).toBe(403);
  });

  it('resends decision emails that were skipped before SMTP was configured', async () => {
    const { row } = await registered();
    await decision.POST(adminPost('/api/admin/decision', { id: row.id, decision: 'approved' }));
    expect((await emailLog(row.id)).at(-1)).toEqual({ kind: 'approval', status: 'skipped' });
    sink.use();
    const res = await body(await resend.POST(adminPost('/api/admin/resend', { ids: [row.id] })));
    expect(res).toMatchObject({ sent: 1, failed: 0 });
    expect((await emailLog(row.id)).at(-1)).toEqual({ kind: 'approval', status: 'sent' });
    const listed = (await body(await data.GET(request('/api/admin/data', { cookie })))).registrations.find((r) => r.id === row.id);
    expect(listed.decisionEmail).toMatchObject({ kind: 'approval', status: 'sent' });
  });

  it('logs failed sends when the SMTP server is unreachable', async () => {
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = '1'; // nothing listens here
    const { row } = await registered();
    const out = await body(await decision.POST(adminPost('/api/admin/decision', { id: row.id, decision: 'approved' })));
    expect(out.email.status).toBe('failed');
    expect(out.registration.status).toBe('approved'); // the decision still saved
  });

  it('reminds pending people at most once a day', async () => {
    sink.use();
    await registered();
    const first = await body(await remind.POST(adminPost('/api/admin/remind', {})));
    expect(first.sent).toBeGreaterThan(0);
    expect(first.sent).toBe(first.total);
    const second = await body(await remind.POST(adminPost('/api/admin/remind', {})));
    expect(second.total).toBe(0);
  });

  it('exports CSV with a BOM and all registrations', async () => {
    const { row } = await registered({ productName: 'CSV Product' });
    const res = await exportRoute.GET(request('/api/admin/export?type=registrations', { cookie }));
    expect(res.headers.get('content-type')).toMatch(/text\/csv/);
    expect(res.headers.get('content-disposition')).toMatch(/onnopoth-registrations-/);
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM so Excel reads Bangla
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('CSV Product');
    expect(text).toContain(String(row.id));
    expect((await exportRoute.GET(request('/api/admin/export?type=nope', { cookie }))).status).toBe(400);
  });
});

describe('submission links and final submissions', () => {
  let approvedRow;
  let token;

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(DURING_REGISTRATION);
    await signIn();
    const b = registrationBody();
    await register.POST(request('/api/register', { method: 'POST', body: b }));
    approvedRow = await registrationByEmail(b.email);
    vi.useRealTimers();
  });

  it('only gives links for approved registrations', async () => {
    expect((await linkRoute.POST(adminPost('/api/admin/link', { id: approvedRow.id }))).status).toBe(409);
    await decision.POST(adminPost('/api/admin/decision', { id: approvedRow.id, decision: 'approved', notify: false }));
    const { link } = await body(await linkRoute.POST(adminPost('/api/admin/link', { id: approvedRow.id })));
    token = new URL(link).searchParams.get('token');
    expect(token).toBeTruthy();
  });

  it('unlocks and pre-fills the form with the token', async () => {
    const res = await body(await access.GET(request(`/api/submit/access?token=${encodeURIComponent(token)}`)));
    expect(res).toMatchObject({ allowed: true, email: approvedRow.email, productName: approvedRow.productName, submitted: null });
    expect((await access.GET(request('/api/submit/access?token=forged.token'))).status).toBe(403);
  });

  it('accepts a submission, stores it against the registration email, and updates on resubmit', async () => {
    vi.setSystemTime(DURING_BUILD);
    sink.use();
    const first = await submit.POST(request('/api/submit', { method: 'POST', body: { ...submissionBody(), token, email: 'someone-else@example.com' } }));
    expect(first.status).toBe(200);
    expect(await body(first)).toMatchObject({ ok: true, updated: false, emailed: true });
    const [row] = await getSql()`select * from ${t('submissions')} where registration_id = ${approvedRow.id}`;
    expect(row.email).toBe(approvedRow.email); // not the email typed into the form

    const again = await body(await submit.POST(request('/api/submit', { method: 'POST', body: { ...submissionBody({ liveUrl: 'https://v2.vercel.app' }), token } })));
    expect(again.updated).toBe(true);
    const prefill = await body(await access.GET(request(`/api/submit/access?token=${encodeURIComponent(token)}`)));
    expect(prefill.submitted).toMatchObject({ liveUrl: 'https://v2.vercel.app' });
  });

  it('refuses without a valid token, with bad input, and after the deadline', async () => {
    vi.setSystemTime(DURING_BUILD);
    expect((await submit.POST(request('/api/submit', { method: 'POST', body: submissionBody() }))).status).toBe(403);
    const bad = await submit.POST(request('/api/submit', { method: 'POST', body: { ...submissionBody({ liveUrl: 'https://github.com/a/b' }), token } }));
    expect(bad.status).toBe(400);
    expect((await bad.json()).fields.liveUrl).toContain('GitHub');
    vi.setSystemTime(AFTER_DEADLINE);
    expect((await submit.POST(request('/api/submit', { method: 'POST', body: { ...submissionBody(), token } }))).status).toBe(403);
  });

  it('stops working if the decision is withdrawn', async () => {
    await decision.POST(adminPost('/api/admin/decision', { id: approvedRow.id, decision: 'pending' }));
    expect((await access.GET(request(`/api/submit/access?token=${encodeURIComponent(token)}`))).status).toBe(403);
    await decision.POST(adminPost('/api/admin/decision', { id: approvedRow.id, decision: 'approved', notify: false }));
  });

  it('scores submissions with validation', async () => {
    const [{ id }] = await getSql()`select id from ${t('submissions')} where registration_id = ${approvedRow.id}`;
    expect((await score.POST(adminPost('/api/admin/score', { submissionId: id, score: 101 }))).status).toBe(400);
    expect((await score.POST(adminPost('/api/admin/score', { submissionId: id, score: 7.5 }))).status).toBe(400);
    expect((await score.POST(adminPost('/api/admin/score', { submissionId: 99999999, score: 50 }))).status).toBe(404);
    const ok = await body(await score.POST(adminPost('/api/admin/score', { submissionId: id, score: 88, notes: 'Strong demo' })));
    expect(ok.submission).toMatchObject({ score: 88, judgeNotes: 'Strong demo' });
  });
});

describe('the participant flow, with an email at every step', () => {
  it('register → confirmation, approve → link, submit → confirmation; or reject → rejection', async () => {
    vi.setSystemTime(DURING_REGISTRATION);
    await signIn();
    sink.use();

    // 1. Register: confirmation email.
    const b = registrationBody();
    await register.POST(request('/api/register', { method: 'POST', body: b }));
    expect(sink.messages.map((m) => [m.to[0], m.subject])).toEqual([[b.email, 'আপনার রেজিস্ট্রেশন গ্রহণ করা হয়েছে']]);
    const reg = await registrationByEmail(b.email);

    // 2. Approve: email with a personal link to submit the live URL.
    sink.clear();
    await decision.POST(adminPost('/api/admin/decision', { id: reg.id, decision: 'approved' }));
    expect(sink.messages).toHaveLength(1);
    expect(sink.messages[0].subject).toMatch(/অ্যাপ্রুভ হয়েছে/);
    expect(sink.messages[0].text).toContain('লাইভ প্রোজেক্ট');
    const token = decodeURIComponent(sink.messages[0].text.match(/submit\?token=([^"\s<&]+)/)[1]);

    // 3. Submit live URL + optional description: confirmation email with what was received.
    sink.clear();
    vi.setSystemTime(DURING_BUILD);
    const res = await submit.POST(request('/api/submit', { method: 'POST', body: { token, liveUrl: 'my-app.vercel.app', description: 'বাজারদর ট্র্যাকার' } }));
    expect(await res.json()).toMatchObject({ ok: true, updated: false, emailed: true });
    expect(sink.messages).toHaveLength(1);
    expect(sink.messages[0].subject).toBe('তোমার প্রোডাক্ট জমা হয়েছে');
    expect(sink.messages[0].text).toContain('https://my-app.vercel.app');
    expect(sink.messages[0].text).toContain('বাজারদর ট্র্যাকার');

    // Resubmitting says "updated".
    sink.clear();
    await submit.POST(request('/api/submit', { method: 'POST', body: { token, liveUrl: 'https://v2.vercel.app' } }));
    expect(sink.messages[0].subject).toBe('তোমার জমা আপডেট হয়েছে');

    // 4. Another registration is rejected: rejection email, and no submission link works.
    vi.setSystemTime(DURING_REGISTRATION);
    const b2 = registrationBody();
    await register.POST(request('/api/register', { method: 'POST', body: b2 }));
    const reg2 = await registrationByEmail(b2.email);
    sink.clear();
    await decision.POST(adminPost('/api/admin/decision', { id: reg2.id, decision: 'declined' }));
    expect(sink.messages.map((m) => m.subject)).toEqual([expect.stringMatching(/^আইডিয়া আপডেট/)]);
    expect(sink.messages[0].text).not.toMatch(/submit\?token=/);
  });
});

describe('results', () => {
  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(DURING_REGISTRATION);
    await signIn();
    vi.useRealTimers();
  });
  const winners = [
    { place: '1st', name: 'A Team', email: 'a@example.com', product: 'Alpha', institution: 'X', marks: 95 },
    { place: '2nd', name: 'B Team', email: 'b@example.com', product: 'Beta', institution: 'Y', marks: 90 },
  ];

  it('publishes, emails winners once, and only re-emails changed places', async () => {
    sink.use();
    const first = await body(await results.POST(adminPost('/api/admin/results', { winners })));
    expect(first).toMatchObject({ published: 2, sent: 2 });
    expect(sink.messages[0].subject).toMatch(/1st স্থান \(Alpha\)/);

    sink.clear();
    const same = await body(await results.POST(adminPost('/api/admin/results', { winners })));
    expect(same.sent).toBe(0);
    expect(sink.messages).toHaveLength(0);

    const changed = await body(await results.POST(adminPost('/api/admin/results', { winners: [winners[0], { ...winners[1], email: 'c@example.com', name: 'C Team' }] })));
    expect(changed.sent).toBe(1);
    expect(sink.messages[0].to[0]).toBe('c@example.com');
  });

  it('validates rows and can unpublish', async () => {
    expect((await results.POST(adminPost('/api/admin/results', { winners: [{ place: '1st' }] }))).status).toBe(400);
    const off = await body(await results.POST(adminPost('/api/admin/results', { winners: [] })));
    expect(off.published).toBe(0);
    const d = await body(await data.GET(request('/api/admin/data', { cookie })));
    expect(d.results).toEqual([]);
    expect(d.activity.map((a) => a.action)).toContain('results.unpublished');
  });
});
