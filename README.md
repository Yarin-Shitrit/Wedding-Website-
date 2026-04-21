# Wedding Website

A full-stack wedding website for guests and couples. Inspired by [welcome-rsvp.com](https://app.welcome-rsvp.com/).

Built with **Next.js 14 (App Router)**, **TypeScript**, **Prisma + SQLite**, **Tailwind CSS**, and **Recharts**.

## Features

1. **Admin panel** for the couple — protected by email/password, backed by signed cookies.
2. **Table organization** — create tables, set capacity, drag guests between tables / unassigned pool, live over-capacity warnings.
3. **Guests management** — searchable table, inline status/side/table edits, CSV import + CSV export.
4. **Venue map** — Google Maps embed on `/venue`, configurable address in the admin settings.
5. **Guest info** — parking, dress code, arrival, accessibility (editable from settings).
6. **RSVP flow** — guests can accept, decline, mark "maybe", set number of seats, dietary preferences, and update any time using a personal link (`/rsvp?token=...`) or their phone number.
7. **BI dashboard** — totals, response rate, attending / declined / maybe / pending, responses over time, invited vs. attending by side, and seating utilization charts.

## Project layout

```
prisma/              Prisma schema and seed script
src/
├── app/             Next.js App Router pages
│   ├── page.tsx           Home (hero + countdown + links)
│   ├── rsvp/              Guest RSVP page + form
│   ├── venue/             Venue map
│   ├── info/              Parking, dress code, arrival
│   ├── admin/             Couple's management panel
│   │   ├── page.tsx       BI dashboard
│   │   ├── guests/        Guests CRUD + CSV import/export
│   │   ├── tables/        Table organization (drag & drop)
│   │   ├── settings/      Wedding details editor
│   │   └── login/         Sign-in page
│   └── api/               Route handlers (REST)
├── components/      Shared UI
├── lib/             prisma client, auth helpers, metrics, settings
└── middleware.ts    Protects /admin/* via JWT cookie
```

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables and fill them in
cp .env.example .env

# 3. Create the database and apply the schema
npm run db:push

# 4. (Optional) seed with a few example guests / tables
npm run db:seed

# 5. Run the dev server
npm run dev
```

The app runs at <http://localhost:3000>.

- Guest site: `/`, `/rsvp`, `/venue`, `/info`
- Admin panel: `/admin` (redirects to `/admin/login` if not signed in)
  Credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.

## CSV import format

The import accepts flexible headers — any of these variants work (case-insensitive):

| Column | Accepted header names |
| --- | --- |
| First name *(required)* | `firstName`, `first_name`, `first name`, `first` |
| Last name | `lastName`, `last_name`, `last name`, `last` |
| Phone | `phone`, `mobile` |
| Email | `email` |
| Side | `side` (bride / groom / shared, Hebrew `חתן` / `כלה` also understood) |
| Group | `group`, `category` |
| Seats invited | `seatsInvited`, `seats_invited`, `seats`, `invited` |
| Table | `table` (table is created if it doesn't exist) |

Rows with a matching `phone` are updated in place so you can re-import the same file safely.

Example CSV:

```csv
firstName,lastName,phone,side,seats,group,table
Alice,Cohen,+972500000001,bride,2,Family,Table 1
Bob,Levi,+972500000002,groom,1,Friends,Table 2
```

## Production notes

- Switch `provider` in `prisma/schema.prisma` to `postgresql` (or `mysql`) and update `DATABASE_URL` for production.
- Set a strong `AUTH_SECRET` (min 32 chars) and rotate admin credentials.
- Put a real value for `NEXT_PUBLIC_VENUE_MAP_URL` / venue address so the embedded map resolves correctly.
