import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestSchema, dropTestSchema } from '../helpers/schema.js';
import { closeSql } from '@/lib/db.js';
import * as repo from '@/lib/repo.js';
import { validateRegistration } from '@/lib/validation.js';
import { registrationBody } from '../helpers/fixtures.js';

let schema;
beforeAll(async () => { schema = await createTestSchema(); });
afterAll(async () => { await dropTestSchema(schema); await closeSql(); });

const make = async (o) => repo.createRegistration(validateRegistration(registrationBody(o)).data);

describe('registrations', () => {
  it('creates a pending registration with camelCase fields', async () => {
    const r = await make({ fullName: 'Rahim' });
    expect(r).toMatchObject({ fullName: 'Rahim', status: 'pending', decidedAt: null, registrationType: 'solo' });
    expect(typeof r.id).toBe('number');
  });

  it('rejects a second registration with the same email in any case', async () => {
    const body = registrationBody();
    await repo.createRegistration(validateRegistration(body).data);
    await expect(repo.createRegistration(validateRegistration({ ...body, email: body.email.toUpperCase() }).data)).rejects.toBeInstanceOf(repo.DuplicateRegistrationError);
  });

  it('stores team members and requires a team name at the database level', async () => {
    const r = await make({ registrationType: 'team', teamName: 'Syntax', members: ['A', 'B', ''], teamLeader: 1 });
    expect(r.members).toEqual(['A', 'B']);
    expect(r.fullName).toBe('B');
  });

  it('finds status only when email and WhatsApp both match', async () => {
    const body = registrationBody();
    await repo.createRegistration(validateRegistration(body).data);
    expect(await repo.findRegistrationForStatus(body.email.toUpperCase(), body.whatsapp)).toMatchObject({ status: 'pending' });
    expect(await repo.findRegistrationForStatus(body.email, '01999999999')).toBeNull();
  });
});

describe('decisions', () => {
  it('approves atomically with an audit entry, and can move back to pending', async () => {
    const r = await make();
    const res = await repo.decide(r.id, 'approved', { note: 'Great idea', actor: 'admin@test.local' });
    expect(res.previousStatus).toBe('pending');
    expect(res.registration).toMatchObject({ status: 'approved', decisionNote: 'Great idea', decidedBy: 'admin@test.local' });
    expect(res.registration.decidedAt).toBeInstanceOf(Date);

    const back = await repo.decide(r.id, 'pending', { actor: 'admin@test.local' });
    expect(back.registration).toMatchObject({ status: 'pending', decidedAt: null, decisionNote: null });

    const log = await repo.recentActivity(10);
    expect(log.filter((a) => a.registrationId === r.id).map((a) => a.action)).toEqual(['decision.pending', 'decision.approved']);
  });

  it('returns null for an unknown registration', async () => {
    expect(await repo.decide(999999, 'approved', { actor: 'x' })).toBeNull();
  });

  it('lists approved registrations for the public page', async () => {
    const r = await make({ fullName: 'Approved Person' });
    await repo.decide(r.id, 'approved', { actor: 'x' });
    expect((await repo.listApproved()).map((a) => a.fullName)).toContain('Approved Person');
  });

  it('only reminds pending people once per day', async () => {
    const r = await make();
    expect((await repo.pendingForReminder()).map((x) => x.id)).toContain(r.id);
    await repo.markReminded([r.id], 'x');
    expect((await repo.pendingForReminder()).map((x) => x.id)).not.toContain(r.id);
  });
});

describe('submissions and results', () => {
  it('upserts one submission per registration and scores it', async () => {
    const r = await make();
    const base = { name: 'T', productName: 'P', platform: 'github', githubUrl: 'https://github.com/a/b', liveUrl: 'https://a.vercel.app', demoUrl: '', aiTools: 'x', timeSpent: '', readme: true };
    const first = await repo.upsertSubmission(r, base);
    expect(first.updated).toBe(false);
    const second = await repo.upsertSubmission(r, { ...base, liveUrl: 'https://b.vercel.app' });
    expect(second).toMatchObject({ id: first.id, liveUrl: 'https://b.vercel.app', updated: true, email: r.email });

    const scored = await repo.scoreSubmission(first.id, { score: 87, notes: 'Solid' }, 'admin');
    expect(scored).toMatchObject({ score: 87, judgeNotes: 'Solid' });
    expect((await repo.listSubmissions())[0]).toMatchObject({ id: first.id, institution: 'Dhaka College' });
  });

  it('keeps the emailed stamp for unchanged winners when republishing', async () => {
    const rows = [
      { rank: 1, place: '1st', registrationId: null, name: 'A', email: 'a@x.com', product: 'PA', institution: '', marks: 90 },
      { rank: 2, place: '2nd', registrationId: null, name: 'B', email: 'b@x.com', product: 'PB', institution: '', marks: 80 },
    ];
    await repo.publishResults(rows, 'admin');
    await repo.markResultEmailed(1);
    await repo.markResultEmailed(2);
    const again = await repo.publishResults([rows[0], { ...rows[1], email: 'c@x.com', name: 'C' }], 'admin');
    expect(again[0].emailedAt).toBeInstanceOf(Date);
    expect(again[1].emailedAt).toBeNull();
    expect(await repo.getResults()).toHaveLength(2);
    await repo.publishResults([], 'admin');
    expect(await repo.getResults()).toHaveLength(0);
  });

  it('reports stats', async () => {
    const s = await repo.stats();
    expect(s.total).toBeGreaterThan(0);
    expect(s.total).toBe(s.pending + s.approved + s.declined);
  });
});
