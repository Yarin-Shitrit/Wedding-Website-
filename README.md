# Wedding Website

Hebrew/RTL, mobile-first wedding site. Guests RSVP via phone (future WhatsApp-API ready), the couple manages the list, tables, and content from an admin panel, and a BI dashboard surfaces response metrics.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS (RTL with logical properties) + `next/font` Heebo + Assistant
- Prisma ORM + PostgreSQL
- `jose` JWT cookies (admin + guest sessions)
- `@dnd-kit` for drag-drop seating, `recharts` for dashboard charts, `papaparse` for CSV, `libphonenumber-js` for phone normalization

## Features

- **Public site** (`/`): hero + countdown, story, venue map (Google Maps embed + Waze deep link), parking/info, gift block.
- **Guest RSVP** (`/rsvp`): phone lookup → JWT cookie session → view / accept / decline / update headcount, dietary, notes.
- **Admin** (`/admin`, password-gated):
  - Dashboard — totals, status breakdown, side split, table utilization, responses over time, pending follow-up list, dietary breakdown.
  - Guests — search/filter, CRUD, bulk CSV import (upsert by phone) + CSV export.
  - Tables — create/delete, drag-drop (or tap-to-assign on mobile), capacity warnings.
  - Content — edit hero / story / venue / parking / gift blocks.

## Local setup

```bash
cp .env.example .env
# edit .env — at minimum set ADMIN_PASSWORD and SESSION_SECRET

docker compose up -d        # starts Postgres on :5432
npm install
npm run db:migrate          # creates schema
npm run db:seed             # seeds tables, content blocks, and sample guests
npm run dev
```

Open http://localhost:3000

- Public: `/`
- Guest RSVP: `/rsvp` (try `050-1234567` from the seed)
- Admin: `/admin/login` (password = `ADMIN_PASSWORD` from `.env`)

## CSV format

Import a guest list from `/admin/guests` → "ייבוא מ-CSV".

```csv
firstName,lastName,phone,side,relation,invitedCount
אבי,מזרחי,050-1111111,groom,אח,2
```

`side` accepts `bride`/`groom`/`both` or Hebrew `כלה`/`חתן`/`משותף`. Import is an upsert keyed on phone (E.164 normalized). Rows with invalid phones are reported back, not committed. A sample lives at `fixtures/guests.sample.csv`.

## Deploy to Vercel

1. Provision a Postgres database (Vercel Postgres, Neon, Supabase, Railway — any reachable over the public internet).
2. Push the repo to GitHub.
3. In Vercel → "New Project" → import the repo.
4. Set environment variables (Project Settings → Environment Variables):
   - `DATABASE_URL` — connection string with `?sslmode=require` for hosted Postgres
   - `ADMIN_PASSWORD` — strong password for the couple
   - `SESSION_SECRET` — 32+ char random string (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_WEDDING_DATE` — ISO date with timezone
   - `NEXT_PUBLIC_BRIDE_NAME` / `NEXT_PUBLIC_GROOM_NAME`
5. Deploy. The build (`vercel.json`) runs `prisma migrate deploy && next build` so schema changes ship with the release.
6. First-time seeding on production: from your laptop with `DATABASE_URL` pointing at the hosted DB, run `npm run db:seed` once.

### CLI alternative

```bash
npm i -g vercel
vercel login
vercel link       # pick / create the project
vercel env add DATABASE_URL production
vercel env add ADMIN_PASSWORD production
vercel env add SESSION_SECRET production
vercel env add NEXT_PUBLIC_WEDDING_DATE production
vercel --prod
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — Prisma generate + Next.js production build
- `npm run db:migrate` — Prisma migrate dev
- `npm run db:seed` — seed sample data
- `npm run db:studio` — Prisma Studio

## Notes / future

- **Admin auth** is an env-var password (MVP). Upgrade to NextAuth / magic links for production.
- **Guest auth** is phone lookup only (no OTP). Schema uses E.164 phone as the ID so a WhatsApp-API OTP / notification layer slots in without migrations.
- **Gallery**, multi-admin roles, and i18n beyond Hebrew are out of scope here.
