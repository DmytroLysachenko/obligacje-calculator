# Gemini CLI - Obligacje Calculator Context

This file provides the necessary architectural and operational context for Gemini CLI to assist effectively in this repository.

## Project Overview
**Obligacje Calculator** is a production-grade investment simulation platform focused on Polish Treasury Bonds (EBI, COI, EDO, etc.) and multi-asset portfolio management. It provides precise financial modeling, historical backtesting, and tax optimization (IKE/IKZE).

- **Primary Domain:** Polish Treasury Bonds, Inflation-linked assets, NBP rates, and Belka tax logic.
- **Architecture:** Feature-based modular architecture (`features/`) combined with Next.js App Router.
- **Data Strategy:** DB-backed metadata for bond definitions and time-series data (Inflation, NBP rates, Market indices) with automated sync jobs.

## Technical Stack
- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Precision Math:** `decimal.js` for all financial calculations (mandatory for accuracy).
- **Background Jobs:** Inngest (Worker engine for data sync and heavy processing).
- **Styling:** Tailwind CSS 4 + Radix UI + Lucide Icons.
- **Charts:** Recharts.
- **Testing:** Vitest + JSDOM.
- **Authentication:** Auth.js (NextAuth) v5.

## Directory Structure
- `app/`: Next.js pages, layouts, and API routes.
- `features/`: Core domain logic organized by feature (e.g., `bond-core`, `portfolio`, `comparison-engine`).
- `lib/`: Shared server-side utilities, data access layers, and API clients.
- `shared/`: Isomorphic components, hooks, and constants used across features.
- `db/`: Drizzle schema definitions and seeding scripts.
- `docs/`: Extensive project documentation (Product, Domain, Architecture, Plans).
- `scripts/`: Maintenance and data utility scripts.

## Building and Running

### Development
```bash
pnpm install
pnpm dev
```

### Database & Data
```bash
# Generate migrations
npx drizzle-kit generate

# Seed production bond definitions and historical data
pnpm run db:seed:production

# Run full data sync (NBP, Stooq)
pnpm run sync:full
```

### Testing & Quality
```bash
pnpm run test        # Run all tests
pnpm run test:core   # Run core bond math tests
pnpm run lint        # Linting
```

## Development Conventions

### 1. Financial Precision
**NEVER** use floating-point math (`number`) for currency or interest calculations. Always use `Decimal.js`.
```typescript
import Decimal from 'decimal.js';
const result = new Decimal(principal).times(rate).dividedBy(100);
```

### 2. Feature-First Organization
Place domain-specific logic, types, and components within `features/[feature-name]`. Only move items to `shared/` or `lib/` if they are truly generic or needed by multiple unrelated features.

### 3. Data Access
Use the data access layer in `lib/data-access.ts` for retrieving macro data and bond definitions. These functions are cached and handle fallbacks gracefully.

### 4. Documentation First
Before implementing large changes, refer to the `docs/` directory. The project maintains a strict "Next 15/10 Commits" execution plan strategy (see `docs/plans/`).

### 5. Testing
All core calculation logic MUST have accompanying tests in its respective feature folder (e.g., `features/bond-core/*.test.ts`).

## Key Symbols & Files
- `features/bond-core/application-service.ts`: Central orchestration for all calculation scenarios.
- `features/bond-core/utils/calculations.ts`: The low-level math engine for interest accrual.
- `db/schema.ts`: Single source of truth for the database model.
- `lib/data-access.ts`: Optimized data retrieval with caching.
- `docs/index.md`: Master index for all project documentation.
