/**
 * All database reads and writes. Rows come back camelCase (postgres.camel).
 */
import { getSql, t } from './db.js';

export class DuplicateRegistrationError extends Error {}

const REG_COLUMNS = (sql) => sql`
  r.id, r.created_at, r.registration_type, r.full_name, r.team_name, r.members, r.institution,
  r.class_name, r.whatsapp, r.email, r.github, r.product_name, r.problem, r.target_users,
  r.features, r.status, r.decision_note, r.decided_at, r.decided_by, r.reminded_at`;

// ---------------------------------------------------------------- registrations

export async function createRegistration(d) {
  const sql = getSql();
  try {
    const [row] = await sql`
      insert into ${t('registrations')} ${sql({
        registrationType: d.registrationType,
        fullName: d.fullName,
        teamName: d.teamName || null,
        members: d.members,
        institution: d.institution,
        className: d.className,
        whatsapp: d.whatsapp,
        email: d.email,
        github: d.github,
        productName: d.productName,
        problem: d.problem,
        targetUsers: d.users,
        features: d.features,
      })}
      returning *`;
    return row;
  } catch (e) {
    if (e.code === '23505') throw new DuplicateRegistrationError('duplicate');
    throw e;
  }
}

export async function getRegistration(id) {
  const sql = getSql();
  const [row] = await sql`select ${REG_COLUMNS(sql)} from ${t('registrations')} r where r.id = ${id}`;
  return row || null;
}

/** Public status lookup: both email and WhatsApp must match. */
export async function findRegistrationForStatus(email, whatsapp) {
  const sql = getSql();
  const [row] = await sql`
    select id, full_name, team_name, product_name, status
    from ${t('registrations')}
    where lower(email) = lower(${email}) and whatsapp = ${whatsapp}`;
  return row || null;
}

/** Everything the dashboard lists, with submission and last-email info joined in. */
export async function listRegistrations() {
  const sql = getSql();
  return sql`
    select ${REG_COLUMNS(sql)},
      s.id as submission_id,
      (select json_build_object('kind', e.kind, 'status', e.status, 'at', e.created_at)
         from ${t('email_log')} e
        where e.registration_id = r.id and e.kind in ('approval', 'decline')
        order by e.created_at desc limit 1) as decision_email
    from ${t('registrations')} r
    left join ${t('submissions')} s on s.registration_id = r.id
    order by r.created_at desc`;
}

export async function listApproved() {
  const sql = getSql();
  return sql`
    select id, full_name, team_name, product_name, institution
    from ${t('registrations')} where status = 'approved' order by full_name`;
}

/**
 * Record a decision and its audit entry atomically.
 * Returns the updated registration and the status it had before.
 */
export async function decide(id, decision, { note = null, actor }) {
  if (!['approved', 'declined', 'pending'].includes(decision)) throw new Error('bad decision');
  return getSql().begin(async (tx) => {
    const [before] = await tx`select status from ${t('registrations')} where id = ${id} for update`;
    if (!before) return null;
    const pending = decision === 'pending';
    const [row] = await tx`
      update ${t('registrations')} set
        status = ${decision},
        decision_note = ${pending ? null : note || null},
        decided_at = ${pending ? null : tx`now()`},
        decided_by = ${pending ? null : actor}
      where id = ${id}
      returning *`;
    await tx`insert into ${t('activity_log')} (actor, action, registration_id, details)
      values (${actor}, ${`decision.${decision}`}, ${id}, ${tx.json({ from: before.status, note: note || undefined })})`;
    return { registration: row, previousStatus: before.status };
  });
}

export async function pendingForReminder() {
  return getSql()`
    select id, full_name, email, product_name from ${t('registrations')}
    where status = 'pending' and (reminded_at is null or reminded_at < now() - interval '24 hours')
    order by created_at`;
}

export async function markReminded(ids, actor) {
  if (!ids.length) return;
  const sql = getSql();
  await sql`update ${t('registrations')} set reminded_at = now() where id in ${sql(ids)}`;
  await logActivity(actor, 'reminders.sent', null, { count: ids.length });
}

// ---------------------------------------------------------------- submissions

export async function getSubmissionByRegistration(registrationId) {
  const [row] = await getSql()`select * from ${t('submissions')} where registration_id = ${registrationId}`;
  return row || null;
}

/**
 * Insert or replace a registration's submission (resubmitting before the
 * deadline updates it). Name and product come from the registration.
 */
export async function upsertSubmission(registration, d) {
  const sql = getSql();
  const values = {
    registrationId: registration.id,
    name: registration.teamName || registration.fullName,
    email: registration.email,
    productName: registration.productName,
    liveUrl: d.liveUrl,
    description: d.description || null,
  };
  const [row] = await sql`
    insert into ${t('submissions')} ${sql(values)}
    on conflict (registration_id) do update set
      updated_at = now(), name = excluded.name, product_name = excluded.product_name,
      live_url = excluded.live_url, description = excluded.description
    returning *, (xmax <> 0) as updated`;
  return row;
}

export async function listSubmissions() {
  const sql = getSql();
  return sql`
    select s.*, r.institution, r.team_name, r.full_name, r.registration_type
    from ${t('submissions')} s join ${t('registrations')} r on r.id = s.registration_id
    order by s.score desc nulls last, s.created_at`;
}

export async function scoreSubmission(id, { score, notes }, actor) {
  const sql = getSql();
  const [row] = await sql`
    update ${t('submissions')} set score = ${score}, judge_notes = ${notes || null},
      scored_at = ${score == null ? null : sql`now()`}
    where id = ${id} returning *`;
  if (row) await logActivity(actor, 'submission.scored', row.registrationId, { score });
  return row || null;
}

// ---------------------------------------------------------------- results

export async function getResults() {
  return getSql()`select * from ${t('results')} order by rank`;
}

/**
 * Replace the published results. A winner keeps their "emailed" stamp when
 * their rank, place, email and product are unchanged, so republishing only
 * emails people whose result is new or different.
 */
export async function publishResults(rows, actor) {
  return getSql().begin(async (tx) => {
    const previous = await tx`select * from ${t('results')}`;
    await tx`delete from ${t('results')}`;
    const saved = [];
    for (const r of rows) {
      const prev = previous.find((p) => p.rank === r.rank && p.email === r.email && p.place === r.place && p.product === r.product);
      const [row] = await tx`
        insert into ${t('results')} ${tx({
          rank: r.rank,
          place: r.place,
          registrationId: r.registrationId,
          name: r.name,
          email: r.email,
          product: r.product,
          institution: r.institution || null,
          marks: r.marks,
          emailedAt: prev?.emailedAt || null,
        })}
        returning *`;
      saved.push(row);
    }
    await tx`insert into ${t('activity_log')} (actor, action, details)
      values (${actor}, ${rows.length ? 'results.published' : 'results.unpublished'}, ${tx.json({ places: rows.length })})`;
    return saved;
  });
}

export async function markResultEmailed(rank) {
  await getSql()`update ${t('results')} set emailed_at = now() where rank = ${rank}`;
}

// ---------------------------------------------------------------- logs & stats

export async function logActivity(actor, action, registrationId = null, details = {}) {
  const sql = getSql();
  await sql`insert into ${t('activity_log')} (actor, action, registration_id, details)
    values (${actor}, ${action}, ${registrationId}, ${sql.json(details)})`;
}

export async function recentActivity(limit = 50) {
  const sql = getSql();
  return sql`
    select a.id, a.created_at, a.actor, a.action, a.details, a.registration_id,
      r.full_name, r.product_name
    from ${t('activity_log')} a left join ${t('registrations')} r on r.id = a.registration_id
    order by a.created_at desc limit ${limit}`;
}

export async function recentEmails(limit = 50) {
  return getSql()`
    select id, created_at, kind, to_email, subject, registration_id, status, error
    from ${t('email_log')} order by created_at desc limit ${limit}`;
}

export async function stats() {
  const sql = getSql();
  const [row] = await sql`
    select
      (select count(*)::int from ${t('registrations')}) as total,
      (select count(*)::int from ${t('registrations')} where status = 'pending') as pending,
      (select count(*)::int from ${t('registrations')} where status = 'approved') as approved,
      (select count(*)::int from ${t('registrations')} where status = 'declined') as declined,
      (select count(*)::int from ${t('registrations')} where created_at > now() - interval '24 hours') as last_day,
      (select count(*)::int from ${t('submissions')}) as submissions,
      (select count(*)::int from ${t('submissions')} where score is not null) as scored,
      (select count(*)::int from ${t('results')}) as results,
      (select count(*)::int from ${t('email_log')} where status <> 'sent') as emails_not_sent`;
  return row;
}
