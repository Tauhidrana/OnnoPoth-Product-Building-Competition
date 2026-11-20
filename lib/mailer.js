/**
 * Sends email and records every attempt in email_log.
 *
 * Works without any mail settings: until SMTP is configured, emails are
 * logged as "skipped" (never thrown), so registrations and decisions still
 * save and the dashboard can resend them later.
 *
 * Config, in order of preference:
 *   SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, SMTP_SECURE ("true" for 465), SMTP_FROM
 *   GMAIL_USER + GMAIL_APP_PASSWORD (Gmail shortcut)
 */
import nodemailer from 'nodemailer';
import { getSql, t } from './db.js';
import { event } from './config.js';

export function mailConfig(env = process.env) {
  if (env.SMTP_HOST) {
    const port = Number(env.SMTP_PORT || 587);
    return {
      transport: {
        host: env.SMTP_HOST,
        port,
        secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS || '' } : undefined,
      },
      from: env.SMTP_FROM || env.SMTP_USER || env.GMAIL_USER || 'no-reply@localhost',
    };
  }
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    return { transport: { service: 'gmail', auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD } }, from: env.GMAIL_USER };
  }
  return null;
}

export const isEmailConfigured = () => mailConfig() !== null;

let cached;
function transporter(cfg) {
  const key = JSON.stringify(cfg.transport);
  if (!cached || cached.key !== key) cached = { key, tx: nodemailer.createTransport(cfg.transport) };
  return cached.tx;
}

/**
 * @returns {Promise<{status: 'sent'|'failed'|'skipped', error?: string}>}
 */
export async function sendEmail({ kind, to, subject, html, text, replyTo, attachments, registrationId = null }) {
  const cfg = mailConfig();
  let status = 'skipped';
  let error = null;

  if (!cfg) {
    error = 'SMTP not configured';
  } else {
    try {
      await transporter(cfg).sendMail({
        from: `"${event.shortName}" <${cfg.from}>`,
        to,
        subject,
        html,
        text,
        replyTo,
        attachments,
      });
      status = 'sent';
    } catch (e) {
      status = 'failed';
      error = String(e?.message || e).slice(0, 500);
      console.warn(`[mail] ${kind} to ${to} failed:`, error);
    }
  }

  try {
    await getSql()`insert into ${t('email_log')} (kind, to_email, subject, registration_id, status, error)
      values (${kind}, ${to}, ${subject}, ${registrationId}, ${status}, ${error})`;
  } catch (e) {
    console.warn('[mail] could not write email_log:', e.message);
  }
  return error ? { status, error } : { status };
}

/** Organizer inbox for notifications; empty means "don't notify". */
export const organizerInbox = () => process.env.RECEIVER_EMAIL || '';
