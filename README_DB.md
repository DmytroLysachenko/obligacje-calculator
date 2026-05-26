# Database and Data Sync Notes

This project uses PostgreSQL with Drizzle ORM, DB-backed bond-definition metadata, and scheduled/background sync for market and macro reference data.

## Environment

Typical local env values:

```env
DATABASE_URL=postgres://user:password@hostname/dbname?sslmode=require
INNGEST_DEV=1
```

For deployed Inngest usage, set the real production keys as well:

```env
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

## Current DB Structure

The repo no longer treats `db/schema.ts` as the canonical long-term structure.

Current layout:
- `db/schemas/**`: grouped schema entrypoints by connected model domains
- `db/seed/**`: seed modules split by concern
- `db/schema.ts`: compatibility aggregate export surface where still needed by current imports

## Drizzle Commands

```bash
npx drizzle-kit generate
pnpm drizzle-kit push
pnpm drizzle-kit studio
```

## Seed and Sync Commands

Production-oriented seed path:

```bash
pnpm run db:seed:production
```

Full sync paths:

```bash
pnpm sync:bond-offers
pnpm sync:full
```

Both commands currently run the same underlying workflow, which covers:
- current bond offers
- issued monthly bond series
- macro reference data
- supporting market-history datasets

## Inngest

Local dev:

```bash
pnpm dev
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Important local behavior:
- use `INNGEST_DEV=1`
- local dev typically does **not** require manual signing-key setup
- the local app endpoint is `http://localhost:3000/api/inngest`

## Data-Layer Boundaries

Use these boundaries when adding or refactoring data access:

- `lib/data/**`: shared read models, cached reads, chart/reference data access
- `lib/server/**`: server-only orchestration, mutations, ownership/auth rules, sync/admin services
- `app/api/**/route.ts`: request parsing, validation, and response shaping only

Do not add new route-local DB query logic when an existing `lib/data/**` or `lib/server/**` boundary already fits.
