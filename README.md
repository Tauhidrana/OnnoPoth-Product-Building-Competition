# Product Building Competition (Using AI) — OnnoPoth

The website for OnnoPoth's online, 12-hour product building competition: registration, idea approval, final submission and results. Bangla first, built with Next.js (App Router) and Tailwind CSS, deployed on Vercel.

There is no database. Registrations, admin decisions and results are sent as emails to the organizer's Gmail inbox, and the site reads them back over IMAP.

## Quick start

Requires Node.js 20.9 or later.

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

All are server-only: they are read in `app/api/*` and `lib/*` and never reach the browser. Set them in `.env.local` locally and under Project → Settings → Environment Variables on Vercel.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GMAIL_USER` | Yes | Gmail address that sends every email, and whose inbox the site reads |
| `GMAIL_APP_PASSWORD` | Yes | 16-character [Gmail App Password](https://myaccount.google.com/apppasswords) (needs 2-step verification), not the normal password |
| `RECEIVER_EMAIL` | Yes | Inbox that receives registrations and submissions |
| `ADMIN_EMAIL` | Yes | Login email for `/admin` |
| `ADMIN_PASSWORD` | Yes | Login password for `/admin` |
| `ADMIN_SESSION_SECRET` | Recommended | Signs admin sessions and approval links. Falls back to `GMAIL_APP_PASSWORD` if unset |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | No | Local testing only: send through a fake SMTP server instead of Gmail. Leave unset on Vercel |

## How the competition flows

1. **Register** on the home page (`/#register`). The organizer gets the details; the participant gets a confirmation with a calendar file.
2. **Review** in `/admin`. Approving emails the participant a personal, signed link to the submission form; declining sends a polite note.
3. **Check status** at `/status` (email + WhatsApp number). Approved teams appear on `/confirmed`.
4. **Submit** at `/submit?token=…` on build day, before the deadline.
5. **Publish results** from `/admin`. Winners are emailed and listed on `/results`.

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
| `/admin` | Organizer panel: approve ideas, send reminders, publish results |

## Editing content

- **`lib/config.js`**: dates and deadlines (all UTC+6), contacts, prizes, judging criteria, sponsor, judges, results, ID card sample and navigation. Change a value here and it updates across the site.
- **`lib/rulebook.js`**: the full rulebook and the FAQ questions.
- **`lib/email.js`**: the shared email layout. Each email's wording lives in its route under `app/api/`.

## Project structure

```
app/
  page.js             home page (assembles the sections)
  layout.js           fonts, metadata, navbar, footer
  globals.css         global styles: buttons, fields, motion, print
  api/                register, submit, status, admin/* routes (emails sent here)
  <route>/page.js     rulebook, status, confirmed, submit, results, admin
components/           page sections and shared UI
  demo/               hero animation (BuildDayDemo) and the vendored stageshow kit
lib/
  config.js           single source of truth for editable values
  phase.js            works out the current phase from the dates
  email.js            shared HTML email layout
  gmail-store.js      reads records back from the Gmail inbox
  admin.js            signed tokens for admin sessions and approval links
  calendar.js         .ics calendar attachment
public/               logos, favicon, Open Graph image
```

## Design

- Light, editorial look: warm paper background, ink text and one brand blue (`#2f5bea`, from the OnnoPoth mark). Colours, fonts and shadows are Tailwind tokens in `tailwind.config.js`.
- Noto Sans Bengali for body text and Hind Siliguri for headings, loaded with `next/font`.
- Motion is small and purposeful: sections fade in on scroll, the timeline fills as dates pass, score bars grow into view. All of it is switched off for visitors with "reduce motion" enabled.
- The hero animation is built with the [stageshow](components/demo/REHEARSAL.md) kit in `components/demo/kit` (TypeScript, vendored as-is). Edit the scene in `components/demo/BuildDayDemo.tsx`.

## Deploy

1. Import the GitHub repo into Vercel.
2. Add the environment variables above.
3. Set `socialLinks.siteUrl` in `lib/config.js` to the production URL; it is used in emails, approval links and SEO metadata.
