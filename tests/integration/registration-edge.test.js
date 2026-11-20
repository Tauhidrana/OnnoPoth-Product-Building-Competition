/**
 * Registration edge cases found while auditing the form (each one was a
 * real bug or rough edge before the fix).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestSchema, dropTestSchema } from '../helpers/schema.js';
import { registrationBody, request } from '../helpers/fixtures.js';
import { closeSql, getSql, t } from '@/lib/db.js';
import { dates } from '@/lib/config.js';
import * as register from '@/app/api/register/route.js';
import * as status from '@/app/api/status/route.js';

let schema;
beforeAll(async () => {
  schema = await createTestSchema();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(new Date(dates.registrationDeadline).getTime() - 86400000));
});
afterAll(async () => {
  vi.useRealTimers();
  await dropTestSchema(schema);
  await closeSql();
});

const post = (b) => register.POST(request('/api/register', { method: 'POST', body: b }));
const row = async (email) => (await getSql()`select * from ${t('registrations')} where email = ${email}`)[0];

describe('registration edge cases', () => {
  it('accepts names at the longest allowed length instead of crashing with a 500', async () => {
    const b = registrationBody({ fullName: 'ক'.repeat(120), className: 'C'.repeat(120), institution: 'I'.repeat(200) });
    const res = await post(b);
    expect(res.status).toBe(200);
  });

  it('rejects over-long names with a field error, not a server error', async () => {
    const res = await post(registrationBody({ fullName: 'ক'.repeat(121), teamName: '', className: 'C'.repeat(121) }));
    expect(res.status).toBe(400);
    const { fields } = await res.json();
    expect(fields).toHaveProperty('fullName');
    expect(fields).toHaveProperty('className');
  });

  it.each([
    ['+8801712345678', '01712345678'],
    ['8801712345678', '01712345678'],
    ['০১৭১২৩৪৫৬৭৮', '01712345678'],
    ['(017) 1234-5678', '01712345678'],
    ['+88 017 1234 5678', '01712345678'],
  ])('normalises WhatsApp %s to %s', async (input, stored) => {
    const b = registrationBody({ whatsapp: input });
    expect((await post(b)).status).toBe(200);
    expect((await row(b.email)).whatsapp).toBe(stored);
  });

  it('finds the registration on the status page whichever way the number is typed', async () => {
    const b = registrationBody({ whatsapp: '01812345678' });
    await post(b);
    const res = await (await status.POST(request('/api/status', { method: 'POST', body: { email: b.email, whatsapp: '+880 1812-345678' } }))).json();
    expect(res.status).toBe('pending');
  });

  it.each(['01212345678', '01012345678', '1712345678'])('rejects a number that is not a Bangladeshi mobile: %s', async (whatsapp) => {
    const res = await post(registrationBody({ whatsapp }));
    expect(res.status).toBe(400);
    expect((await res.json()).fields).toHaveProperty('whatsapp');
  });

  it.each([
    ['https://github.com/rahim-dev', 'rahim-dev'],
    ['github.com/rahim-dev/', 'rahim-dev'],
    ['@rahim-dev', 'rahim-dev'],
    ['https://github.com/rahim-dev/my-repo', 'rahim-dev'],
  ])('stores the GitHub username from %s', async (github, stored) => {
    const b = registrationBody({ github });
    expect((await post(b)).status).toBe(200);
    expect((await row(b.email)).github).toBe(stored);
  });

  it.each(['rahim dev', '-rahim', 'rahim_dev', 'a'.repeat(40)])('rejects invalid GitHub username %s', async (github) => {
    const res = await post(registrationBody({ github }));
    expect(res.status).toBe(400);
    expect((await res.json()).fields).toHaveProperty('github');
  });

  it('needs at least two members for a team and no duplicate names', async () => {
    const solo = await post(registrationBody({ registrationType: 'team', teamName: 'Solo-ish', members: ['Only One', '', ''] }));
    expect((await solo.json()).fields).toHaveProperty('members');
    const dup = await post(registrationBody({ registrationType: 'team', teamName: 'Dups', members: ['Rahim', 'rahim ', ''] }));
    expect((await dup.json()).fields).toHaveProperty('members');
  });

  it('cleans up names: collapses spaces and strips invisible characters', async () => {
    const b = registrationBody({ fullName: '  Rahim​   Uddin  ', productName: 'Bazar‌dor  App' });
    await post(b);
    const r = await row(b.email);
    expect(r.fullName).toBe('Rahim Uddin');
    expect(r.productName).toBe('Bazardor App');
  });

  it('asks for a little more detail when the problem is one or two words', async () => {
    const res = await post(registrationBody({ problem: 'দাম' }));
    expect((await res.json()).fields).toHaveProperty('problem');
  });

  it('stores three required features as a list, ignoring empty optional slots', async () => {
    const b = registrationBody({ features: [' আজকের দাম ', 'দামের ট্রেন্ড', 'এলাকা অনুযায়ী তুলনা', '', ''] });
    expect((await post(b)).status).toBe(200);
    expect((await row(b.email)).features).toEqual(['আজকের দাম', 'দামের ট্রেন্ড', 'এলাকা অনুযায়ী তুলনা']);
  });

  it('accepts up to five features', async () => {
    const b = registrationBody({ features: ['A one', 'B two', 'C three', 'D four', 'E five'] });
    expect((await post(b)).status).toBe(200);
    expect((await row(b.email)).features).toHaveLength(5);
  });

  it.each([
    [['Only one', '', ''], 'অন্তত ৩টি'],
    [['Same', 'same ', 'Other'], 'দুবার'],
    [['A', 'B', 'C', 'D', 'E', 'F'], 'সর্বোচ্চ ৫টি'],
    [['x'.repeat(201), 'B', 'C'], '২০০ অক্ষর'],
  ])('rejects features %j with a clear message', async (features, message) => {
    const res = await post(registrationBody({ features }));
    expect(res.status).toBe(400);
    expect((await res.json()).fields.features).toContain(message);
  });

  it('can still decide on a registration made before features became a list', async () => {
    const [legacy] = await getSql()`insert into ${t('registrations')}
      (registration_type, full_name, institution, class_name, whatsapp, email, github, product_name, problem, target_users, features)
      values ('solo', 'Legacy', 'I', 'C', '01712345678', ${`legacy-${Date.now()}@example.com`}, 'g', 'P', 'p', 'u', ${['one line of features']})
      returning id`;
    const { decide } = await import('@/lib/repo.js');
    const res = await decide(legacy.id, 'approved', { actor: 'admin@test.local' });
    expect(res.registration.status).toBe('approved');
  });

  it('still understands an old-style block of text', async () => {
    const b = registrationBody({ features: '১. আজকের দাম\n২) দামের ট্রেন্ড\n- এলাকা অনুযায়ী তুলনা' });
    expect((await post(b)).status).toBe(200);
    expect((await row(b.email)).features).toEqual(['আজকের দাম', 'দামের ট্রেন্ড', 'এলাকা অনুযায়ী তুলনা']);
  });
});
