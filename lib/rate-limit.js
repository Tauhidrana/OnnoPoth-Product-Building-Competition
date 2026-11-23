/**
 * Database-backed sliding-window rate limit, so limits hold across
 * serverless instances and restarts.
 */
import { getSql, t } from './db.js';

/** Count recent events for (bucket, key); returns true when the limit is reached. */
export async function isLimited(bucket, key, { limit, windowMs }) {
  const sql = getSql();
  // Window measured on the database clock, the same clock that stamps created_at.
  const [{ n }] = await sql`
    select count(*)::int as n from ${t('rate_events')}
    where bucket = ${bucket} and key = ${key}
      and created_at > now() - make_interval(secs => ${windowMs / 1000})`;
  return n >= limit;
}

export async function recordEvent(bucket, key) {
  const sql = getSql();
  await sql`insert into ${t('rate_events')} (bucket, key) values (${bucket}, ${key})`;
  // Opportunistic cleanup keeps the table small.
  if (Math.random() < 0.05) await sql`delete from ${t('rate_events')} where created_at < now() - interval '2 days'`;
}

/** Record and check in one go (for actions that always count, like form posts). */
export async function hit(bucket, key, opts) {
  if (await isLimited(bucket, key, opts)) return true;
  await recordEvent(bucket, key);
  return false;
}

export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
