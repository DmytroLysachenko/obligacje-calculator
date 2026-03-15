# Database & Data Sync Infrastructure

This project uses **Neon (Serverless PostgreSQL)**, **Drizzle ORM**, and **Inngest** for background data synchronization.

## 1. Setup Environment Variables

Add the following to your `.env.local`:

```env
DATABASE_URL=postgres://user:password@hostname/dbname?sslmode=require
INNGEST_EVENT_KEY=your_key_here
INNGEST_SIGNING_KEY=your_key_here
```

## 2. Database Commands (Drizzle)

- **Generate migrations:** `pnpm drizzle-kit generate`
- **Push schema to DB (Direct):** `pnpm drizzle-kit push`
- **Open Drizzle Studio:** `pnpm drizzle-kit studio`

## 3. Data Synchronization (Inngest)

The application fetches data from:
- **NBP API** (Gold Prices, Interest Rates)
- **Stooq API** (S&P 500, Stock Indices)

Sync is handled by the `sync-economic-data` Inngest function, which runs twice daily.

### To test locally:
1. Start the Inngest Dev Server: `npx inngest-cli@latest dev`
2. Open `http://localhost:8288` to trigger functions manually.

## 4. Architecture

- `db/schema.ts`: Single source of truth for database structure.
- `lib/api-clients/`: Abstracted fetchers for external economic data.
- `lib/data-access.ts`: Server-side data fetching layer (used by Page components).
- `app/api/inngest/route.ts`: Entry point for background jobs.
