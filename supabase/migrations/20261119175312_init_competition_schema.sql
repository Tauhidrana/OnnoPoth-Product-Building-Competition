-- OnnoPoth Product Building Competition — core schema.
--
-- Access model: only the Next.js server touches these tables, over a direct
-- Postgres connection (DATABASE_URL). RLS is enabled with no policies and the
-- anon / authenticated roles have no privileges, so nothing is reachable
-- through the Supabase Data API with the publishable key.
--
-- Table names are deliberately unqualified so the test suite can apply this
-- file into a throwaway schema with `set local search_path`.

-- Registrations: one row per participant / team, keyed by the leader's email.
create table registrations (
  id                bigint generated always as identity primary key,
  created_at        timestamptz not null default now(),
  registration_type text not null check (registration_type in ('solo', 'team')),
  full_name         text not null check (length(full_name) between 1 and 120),
  team_name         text check (length(team_name) <= 120),
  members           text[] not null default '{}' check (cardinality(members) <= 3),
  institution       text not null check (length(institution) between 1 and 200),
  class_name        text not null check (length(class_name) between 1 and 120),
  whatsapp          text not null check (whatsapp ~ '^01[0-9]{9}$'),
  email             text not null check (length(email) between 3 and 254),
  github            text not null check (length(github) between 1 and 100),
  product_name      text not null check (length(product_name) between 1 and 160),
  problem           text not null check (length(problem) between 1 and 4000),
  target_users      text not null check (length(target_users) between 1 and 4000),
  features          text not null check (length(features) between 1 and 4000),
  status            text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  decision_note     text check (length(decision_note) <= 1000),
  decided_at        timestamptz,
  decided_by        text,
  reminded_at       timestamptz,
  constraint registrations_team_has_name check (registration_type = 'solo' or length(coalesce(team_name, '')) > 0),
  constraint registrations_decision_stamped check ((status = 'pending') = (decided_at is null))
);

-- One registration per person (case-insensitive email).
create unique index registrations_email_key on registrations (lower(email));
-- Dashboard filters by status and sorts newest first.
create index registrations_status_created_idx on registrations (status, created_at desc);

-- Final product submissions: at most one per registration (resubmitting replaces it).
create table submissions (
  id              bigint generated always as identity primary key,
  registration_id bigint not null unique references registrations (id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  name            text not null check (length(name) between 1 and 160),
  email           text not null,
  product_name    text not null check (length(product_name) between 1 and 160),
  platform        text not null check (platform in ('github', 'lovable', 'v0')),
  github_url      text check (length(github_url) <= 500),
  live_url        text not null check (length(live_url) <= 500),
  demo_url        text check (length(demo_url) <= 500),
  ai_tools        text not null check (length(ai_tools) between 1 and 4000),
  time_spent      text check (length(time_spent) <= 120),
  readme          boolean not null default false,
  score           smallint check (score between 0 and 100),
  judge_notes     text check (length(judge_notes) <= 2000),
  scored_at       timestamptz,
  constraint submissions_github_needs_url check (platform <> 'github' or github_url is not null)
);

-- Published results: up to ten places. Replaced as a whole on each publish.
create table results (
  rank            smallint primary key check (rank between 1 and 10),
  place           text not null check (length(place) between 1 and 40),
  registration_id bigint references registrations (id) on delete set null,
  name            text not null,
  email           text not null,
  product         text not null,
  institution     text,
  marks           smallint check (marks between 0 and 100),
  published_at    timestamptz not null default now(),
  emailed_at      timestamptz
);
create index results_registration_id_idx on results (registration_id);

-- Every email the site tries to send, so the dashboard can show what was
-- skipped (SMTP not configured yet) or failed, and resend it.
create table email_log (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  kind            text not null,
  to_email        text not null,
  subject         text not null,
  registration_id bigint references registrations (id) on delete set null,
  status          text not null check (status in ('sent', 'failed', 'skipped')),
  error           text
);
create index email_log_registration_id_idx on email_log (registration_id);
create index email_log_created_idx on email_log (created_at desc);

-- Audit trail of organizer actions.
create table activity_log (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  actor           text not null,
  action          text not null,
  registration_id bigint references registrations (id) on delete set null,
  details         jsonb not null default '{}'
);
create index activity_log_registration_id_idx on activity_log (registration_id);
create index activity_log_created_idx on activity_log (created_at desc);

-- Rate limiting that survives serverless restarts (login, register, submit, status).
create table rate_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  bucket     text not null,
  key        text not null
);
create index rate_events_lookup_idx on rate_events (bucket, key, created_at desc);

-- Lock everything down: server-only access.
alter table registrations enable row level security;
alter table submissions   enable row level security;
alter table results       enable row level security;
alter table email_log     enable row level security;
alter table activity_log  enable row level security;
alter table rate_events   enable row level security;

revoke all on table registrations, submissions, results, email_log, activity_log, rate_events from anon, authenticated;
revoke all on sequence registrations_id_seq, submissions_id_seq, email_log_id_seq, activity_log_id_seq, rate_events_id_seq from anon, authenticated;
