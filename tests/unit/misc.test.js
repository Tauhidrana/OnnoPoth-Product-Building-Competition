import { describe, expect, it } from 'vitest';
import { toCsv } from '@/lib/csv.js';
import { mailConfig } from '@/lib/mailer.js';
import { phaseAt } from '@/lib/phase.js';
import { dates } from '@/lib/config.js';
import * as T from '@/lib/email-templates.js';

describe('toCsv', () => {
  it('quotes, joins arrays, starts with a BOM and neutralises formulas', () => {
    const csv = toCsv([['a', 'A'], ['b', 'B']], [{ a: 'x,"y"', b: ['m', 'n'] }, { a: '=HYPERLINK("evil")', b: null }]);
    expect(csv.startsWith('﻿A,B\r\n')).toBe(true);
    expect(csv).toContain('"x,""y""",m; n');
    expect(csv).toContain(`"'=HYPERLINK(""evil"")",`);
  });
});

describe('mailConfig', () => {
  it('is null with no settings, so emails are skipped not crashed', () => {
    expect(mailConfig({})).toBeNull();
    expect(mailConfig({ GMAIL_USER: 'a@gmail.com' })).toBeNull();
  });
  it('prefers SMTP_* and infers TLS from the port', () => {
    expect(mailConfig({ SMTP_HOST: 'smtp.x', SMTP_PORT: '465', SMTP_USER: 'u', SMTP_PASS: 'p' })).toMatchObject({ transport: { host: 'smtp.x', port: 465, secure: true, auth: { user: 'u' } }, from: 'u' });
    expect(mailConfig({ SMTP_HOST: 'smtp.x', SMTP_FROM: 'f@x' })).toMatchObject({ transport: { port: 587, secure: false, auth: undefined }, from: 'f@x' });
  });
  it('supports the Gmail shortcut', () => {
    expect(mailConfig({ GMAIL_USER: 'a@gmail.com', GMAIL_APP_PASSWORD: 'p' })).toMatchObject({ transport: { service: 'gmail' }, from: 'a@gmail.com' });
  });
});

describe('phaseAt', () => {
  const t = (iso, ms = 0) => new Date(iso).getTime() + ms;
  it('moves through the competition phases at the configured times', () => {
    expect(phaseAt(t(dates.registrationDeadline, -1))).toBe('registration');
    expect(phaseAt(t(dates.registrationDeadline, 1))).toBe('review');
    expect(phaseAt(t(dates.competitionStart, 1))).toBe('live');
    expect(phaseAt(t(dates.competitionEnd, 1))).toBe('judging');
  });
});

describe('email templates', () => {
  const evil = '<script>alert(1)</script>';
  const reg = { id: 1, registrationType: 'team', fullName: evil, teamName: 'T', members: [evil], institution: 'I', className: 'C', whatsapp: '01712345678', email: 'a@b.c', github: 'g', productName: evil, problem: 'p', targetUsers: 'u', features: ['f1', evil, 'f3'], decisionNote: evil };
  const sub = { name: evil, email: 'a@b.c', productName: 'P', platform: 'github', githubUrl: 'https://github.com/a/b', liveUrl: 'https://x.vercel.app/"><img>', demoUrl: '', aiTools: evil, timeSpent: '', readme: true };
  const all = {
    registrationOrganizer: T.registrationOrganizer(reg),
    registrationConfirmation: T.registrationConfirmation(reg),
    submissionOrganizer: T.submissionOrganizer(sub),
    submissionConfirmation: T.submissionConfirmation(sub),
    approval: T.approval(reg, 'https://site/submit?token=abc'),
    decline: T.decline(reg),
    result: T.result({ rank: 1, place: '1st', name: evil, product: 'P', marks: 92 }),
    reminder: T.reminder(reg),
  };

  it.each(Object.keys(all))('%s has a subject, text and an escaped HTML body', (k) => {
    const m = all[k];
    expect(m.subject.length).toBeGreaterThan(3);
    expect(m.text.length).toBeGreaterThan(3);
    expect(m.html).toMatch(/^<!doctype html>/);
    expect(m.html).not.toContain('<script>');
    expect(m.html).not.toContain('"><img>');
  });

  it('puts the personal submit link in the approval email', () => {
    expect(all.approval.html).toContain('https://site/submit?token=abc');
    expect(all.approval.text).toContain('https://site/submit?token=abc');
  });

  it('lists features as numbered lines in the organizer email', () => {
    expect(all.registrationOrganizer.html).toContain('1. f1<br/>2. &lt;script&gt;');
    expect(all.registrationOrganizer.text).toContain('3. f3');
  });

  it('shows scores in Bangla digits', () => {
    expect(all.result.html).toContain('৯২ / ১০০');
  });
});
