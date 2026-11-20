# Product Building Competition (Using AI) — OnnoPoth

The website for OnnoPoth's online, 12-hour product building competition: registration, idea approval, final submission and results. Bangla first, built with Next.js (App Router) and Tailwind CSS, deployed on Vercel.

Data lives in **Supabase Postgres**. Only the Next.js server talks to the database (over a direct Postgres connection); the tables have row-level security on and no public access, so nothing is reachable with the publishable key. Email is optional: until SMTP is set up, everything still saves and the dashboard can send the pending emails later.

## Quick start

Requires Node.js 20.12 or later.

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build |

## Environment variables

All are server-only. Set them in `.env.local` locally and under Project → Settings → Environment Variables on Vercel. `.env.example` has a commented template.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase **Session pooler** connection string (IPv4, port 5432), password URL-encoded |
| `ADMIN_EMAIL` | Yes | Login email for `/admin` |
| `ADMIN_PASSWORD` | Yes | Login password for `/admin` |
| `ADMIN_SESSION_SECRET` | Yes | 16+ random characters; signs admin sessions and approval links. `/admin` stays locked without it |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | No | Any SMTP provider. Add when ready |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | No | Gmail shortcut instead of `SMTP_*` |
| `RECEIVER_EMAIL` | No | Gets a copy of every registration and submission |
| `DB_POOL_MAX` | No | Connections per server instance (default 3) |

**Connection string gotchas.** Supabase's direct connection (`db.<ref>.supabase.co`) is IPv6-only and doesn't work from Vercel; use the session pooler. Don't use the transaction pooler (port 6543): the Postgres driver hangs there when queries run in parallel. Characters such as `$` or `@` in the password must be URL-encoded (`%24`, `%40`); in `.env` files a raw `$` is also treated as a variable.

## Database

The schema lives in `supabase/migrations/` (registrations, submissions, results, email log, activity log, rate limits). Apply it with the Supabase CLI:

```bash
supabase db push --db-url "$DATABASE_URL"
supabase migration list --db-url "$DATABASE_URL"
```

For a schema change, create a new file with `supabase migration new <name>`, write the SQL, run the tests, then push.

## How the competition flows

1. **Register** on the home page (`/#register`). One registration per email; the participant gets a confirmation with a calendar file.
2. **Review** in `/admin`. Approving emails the participant a personal, signed link to the submission form; declining sends a polite note. Every decision can be undone.
3. **Check status** at `/status` (email + WhatsApp number). Approved teams appear on `/confirmed`.
4. **Submit** at `/submit?token=…` on build day, before the deadline. The form is pre-filled; submitting again updates the earlier submission.
5. **Score and publish** from `/admin`. Winners are emailed once and listed on `/results`.

The home page follows the calendar on its own. The header badge, the main button (register → status → submit → results) and the timeline's "এখন চলছে" step all come from the dates in `lib/config.js`.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home: hero, how it works, timeline, rules & judging, prizes, registration, ID card, FAQ, contact |
| `/rulebook` | Full rulebook, with print / save as PDF |
| `/status` | Participants check whether their idea is approved |
| `/confirmed` | Public list of approved participants |
| `/submit` | Final product submission (opens only from an approval link) |
| `/results` | Final results and judging criteria |
| `/admin` | Organizer dashboard (see below) |

## Admin dashboard

`/admin` is built around the organizer's day:

- **"What to do now"** card that follows the competition phase: ideas waiting for review, teams yet to submit, submissions without a score, results ready to publish.
- **Registrations:** filter by pending / approved / declined, search everything, open an idea in a side panel. Approve or decline with a confirmation (with an optional note that goes into the email), then the next pending idea opens. Keyboard: `j`/`k` to move, `a` approve, `d` decline, `/` search. Every decision can be undone from the toast or the panel.
- **Email status everywhere:** each decision shows whether its email went out. Before SMTP is configured, decisions still save; afterwards, one button sends all pending emails. Approved teams' personal submission links can be copied to send over WhatsApp.
- **Reminders** to pending participants (at most once a day each).
- **Submissions & scores:** links to each live product, repo and demo, a score and private notes per submission, and a list of approved teams who haven't submitted yet.
- **Results:** built from the top scores in one click, editable and reorderable, previewed before publishing. Republishing only emails winners whose result changed; results can be unpublished.
- **Activity and email log**, plus CSV export of registrations and submissions (opens correctly in Excel, Bangla included).

Security: login is disabled unless all three admin variables are set, and is locked for 15 minutes after five failed attempts per IP. Sessions are HMAC-signed, HTTP-only, `SameSite=Strict` cookies. Admin actions must be same-origin JSON requests, and `/admin` is excluded from search engines.

## Tests

```bash
npm test          # unit + integration (Vitest)
npm run test:e2e  # browser end-to-end (Playwright, uses your installed Chrome)
```

- **Unit:** validation, auth and tokens (including the old empty-login bypass), CSV, mail settings, competition phases, every email template (escaping included).
- **Integration:** every API route against a real database, from registration through approval, submission, scoring and results, with email captured by a local SMTP sink. Also rate limits, login lockout, CSRF checks, duplicate registrations and token misuse.
- **End-to-end:** a production build clicked through in Chrome as a participant and as the organizer, on desktop and phone sizes.

Integration and e2e tests need `DATABASE_URL`. Each run creates its own throwaway Postgres schema, applies the migrations to it, and drops it afterwards, so real data is never touched. The registration and submission e2e steps skip themselves once those windows have closed.

## Editing content

- **`lib/config.js`**: dates and deadlines (all UTC+6), contacts, prizes, judging criteria, sponsor, judges, results, ID card sample and navigation. Change a value here and it updates across the site.
- **`lib/rulebook.js`**: the full rulebook and the FAQ questions.
- **`lib/email-templates.js`**: the wording of every email; **`lib/email.js`** is the shared layout.

## Project structure

```
app/
  page.js             home page (assembles the sections)
  layout.js           fonts, metadata, navbar, footer
  globals.css         global styles: buttons, fields, motion, print
  api/                public routes (register, status, submit) and admin/* routes
  admin/              organizer dashboard page
  <route>/page.js     rulebook, status, confirmed, submit, results
components/           page sections and shared UI
  admin/              dashboard views (registrations, submissions, results, activity)
  demo/               hero animation (BuildDayDemo) and the vendored stageshow kit
lib/
  config.js           single source of truth for editable values
  db.js               Postgres client (Supabase session pooler)
  repo.js             every database read and write
  validation.js       server-side form validation
  admin.js            admin auth, signed sessions and approval links
  mailer.js           sends email and records every attempt
  email-templates.js  the emails; email.js is their shared layout
  rate-limit.js       database-backed rate limiting
  phase.js            works out the current phase from the dates
supabase/migrations/  database schema
tests/                unit, integration and e2e tests
public/               logos, favicon, Open Graph image
```

## Design

- Light, editorial look: warm paper background, ink text and one brand blue (`#2f5bea`, from the OnnoPoth mark). Colours, fonts and shadows are Tailwind tokens in `tailwind.config.js`.
- Noto Sans Bengali for body text and Hind Siliguri for headings, loaded with `next/font`.
- Motion is small and purposeful: sections fade in on scroll, the timeline fills as dates pass, score bars grow into view. All of it is switched off for visitors with "reduce motion" enabled.
- The hero animation is built with the [stageshow](components/demo/REHEARSAL.md) kit in `components/demo/kit` (TypeScript, vendored as-is). Edit the scene in `components/demo/BuildDayDemo.tsx`.

## Deploy

1. Import the GitHub repo into Vercel.
2. Apply the migrations to your Supabase project (`supabase db push`, above).
3. Add the environment variables above. Email can come later.
4. Set `socialLinks.siteUrl` in `lib/config.js` to the production URL; it is used in emails, approval links and SEO metadata.
