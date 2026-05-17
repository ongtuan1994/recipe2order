# Recipe to Order

A recipe / stock / purchase-planning web app for small cafés.

See [`CLAUDE.md`](./CLAUDE.md) for the full project brief and [`docs/sprint-plan.md`](./docs/sprint-plan.md) for the 8-sprint MVP plan.

## Stack

Next.js (App Router) + TypeScript • Tailwind v4 + shadcn/ui • Prisma + Neon (Postgres) • NextAuth.js • next-intl (th / en) • Vercel Blob • Vercel Cron

## Getting started

```bash
# 1. Install deps
npm install

# 2. Copy env and fill in values
cp .env.example .env

# 3. Migrate + seed
npx prisma migrate dev
npm run seed

# 4. Run
npm run dev
```

Demo login (after seeding): `demo@recipe-to-order.local` / `demo1234`

Open <http://localhost:3000> — it will redirect to `/th`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run seed` | Run `prisma/seed.ts` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:studio` | Prisma Studio |

## Layout

```
app/[locale]/(auth)/      login, register
app/[locale]/(dashboard)/ dashboard, recipes, prep-recipes, ingredients,
                          stock, capacity, sales, purchase-plans
app/api/                  NextAuth, upload, export, import, pdf, cron
lib/                      prisma, auth, blob, stock/, units/, excel/, pdf/
i18n/                     next-intl routing + request config
messages/                 th.json, en.json
prisma/                   schema.prisma, seed.ts, migrations/
docs/                     sprint-plan.md, wireframes.md
```

Stock / capacity / explode logic and Excel + PDF helpers are stubbed under `lib/` and filled in across sprints 4–7 (see sprint plan).
