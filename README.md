# Sanger Varsity Boys Soccer

Next.js 16 + Supabase (Postgres, Storage). One open player-profile form, a public schedule with calendar feed,
approved-only public player pages, and a passcode-protected coach dashboard.

## Pages
| Route | What |
|---|---|
| `/join` | Open player form (team code required): base info, profile, goals/intentions, photo, social permission |
| `/schedule` | Public schedule: list + month view. `/schedule/ics` is a subscribable calendar feed |
| `/players`, `/players/[id]` | Public profiles. Only players you **approve** who gave photo permission. First name + last initial only. No contact info |
| `/team` | Team-code-protected schedule: public + team-only events, with notes |
| `/coach` | Passcode-protected: see submissions, approve/unapprove/hide/delete |

## Setup
1. Create a Supabase project. In the SQL editor, run `supabase/migrations/0001_init.sql`.
2. `cp .env.example .env.local` and fill it in (Supabase URL + service-role key, `TEAM_CODE`, `COACH_PASSCODE`,
   `SESSION_SECRET` from `openssl rand -hex 32`).
3. `npm run dev` and open http://localhost:3000
4. Import the schedule: `npx tsx scripts/import-schedule.ts path/to/schedule.csv --dry-run`, then without `--dry-run`.
   Columns are matched by name (date, time, opponent/title, location, type, notes, visibility); see `data/sample-schedule.csv`.
   Re-importing updates events matched on date + title.

## Security model
- RLS is on with **no policies**: the browser/anon key can't touch any table. All reads/writes go through server code
  using the service-role key (server-only; never `NEXT_PUBLIC_`).
- Public pages select an explicit column allow-list; contact info, parent info and internal event notes never leave the server.
- The photo bucket is private; images are served via 1-hour signed URLs.
- The form is protected by the team code, a honeypot field, a best-effort rate limit, and a unique-email constraint.

## Not built yet
Player accounts (magic link / Google), staff table UI, reading GroupMe messages, AI tasks.

## GroupMe
Create a bot at dev.groupme.com (Bots -> Create Bot, pick the group) and put its Bot ID in `GROUPME_BOT_ID`.
`npx tsx scripts/groupme-post.ts "message"` previews; add `--send` to post. Max 1000 chars.

The season importer also reads an optional `Visibility` column (public | team | staff) and the trailing notes column.
