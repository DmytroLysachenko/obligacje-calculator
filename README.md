# Obligacje Calculator - Production Ready

The most trusted, accurate, and educational investment simulation platform for Polish Treasury Bonds and other assets.

## Core Features
- **Production-Grade Bond Math:** Exact interest accrual, day-count conventions, and Belka tax rounding.
- **Real Data Integration:** Automated sync with NBP (rates) and Stooq (S&P 500, Gold).
- **Background Sync:** Reliable cron-driven data updates via Inngest.
- **Unified Calculation Domain:** Shared engine across Single, Regular, and Comparison simulations.
- **User Portfolios:** Scaffolding for tracking real investments with authenticated or guest access.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL with Drizzle ORM
- **Worker Engine:** Inngest
- **Math:** Decimal.js for financial precision
- **Styling:** Tailwind CSS

## Documentation
The documentation is now segregated for better readability:
- [Product Strategy](./docs/product/01_product_vision_and_purpose.md)
- [System Architecture](./docs/architecture/19_system_architecture.md)
- [Bond Domain Guide](./docs/domain/04_polish_bonds_domain_guide.md)
- [Implementation Roadmap](./docs/plans/roadmap.md)

See the full [Documentation Index](./docs/index.md) for more details.

## Development

### Setup
1. Clone the repository.
2. Install dependencies: `pnpm install`.
3. Set up environment variables in `.env` (see `.env.example`).
4. Generate DB migrations: `npx drizzle-kit generate`.
5. Seed production data: `pnpm run db:seed:production`.
6. Start dev server: `pnpm run dev`.

### Testing
- `pnpm run test`: Run all Vitest suites.
- `pnpm run lint`: Run ESLint checks.
