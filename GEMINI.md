# Gemini CLI - Obligacje Calculator Context

This file provides the necessary architectural and operational context for Gemini CLI to assist effectively in this repository.

## Project Overview
**Obligacje Calculator** is a production-grade investment simulation platform focused on Polish Treasury Bonds (EBI, COI, EDO, etc.) and multi-asset portfolio management. It provides precise financial modeling, historical backtesting, and tax optimization (IKE/IKZE).

- **Primary Domain:** Polish Treasury Bonds, Inflation-linked assets, NBP rates, and Belka tax logic.
- **Architecture:** Feature-based modular architecture (`features/`) combined with Next.js App Router.
- **Data Strategy:** DB-backed metadata for bond definitions and time-series data (Inflation, NBP rates, Market indices) with automated sync jobs.
- **Product Direction:** Flagship surfaces are single-calculator, comparison, regular investment, ladder, notebook/workspace, and economic-data. Secondary tools such as multi-asset and recovery-lab should stay explicitly demoted.

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
- `lib/data/`: Cached read models and shared data retrieval helpers.
- `lib/server/`: Server-only services, repositories, HTTP helpers, auth/ownership helpers, and sync orchestration.
- `lib/api-clients/`: External provider clients and fetch adapters.
- `shared/components/`: Reusable UI grouped by subdomain such as `page`, `feedback`, `results`, `chrome`, `insights`, and `charts`.
- `shared/`: Isomorphic components, hooks, and UI-facing helpers used across features.
- `db/schemas/`: Grouped schema entrypoints by connected data-model domains.
- `db/seed/`: Seed modules split by concern plus top-level orchestration entrypoints.
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
Use `lib/data/market-data.ts` for shared cached market-data reads and `lib/server/**` services for server-side orchestration. Do not query the database directly from page components or API routes when an existing service/repository boundary fits.

### 4. Documentation First
Before implementing large changes, refer to the `docs/` directory. The project maintains a strict "Next 15/10 Commits" execution plan strategy (see `docs/plans/`).

### 5. Testing
All core calculation logic MUST have accompanying tests in its respective feature folder (e.g., `features/bond-core/*.test.ts`).

### 6. Coding Rules
Repository-wide coding rules are strict, not advisory. See:

- `docs/technical/architecture/26_engineering_and_coding_rules.md`

Key requirements:

- no inline `language === 'pl' ? '...' : '...'` branches for UI copy
- no inline `pickLanguageValue(language, { pl: '...', en: '...' })` for translated content
- no hardcoded translated values in code; translated strings, arrays, and objects must live in locale resources
- use `next-intl` as the i18n system of record; do not add custom translation runtimes or locale-node resolution layers
- client components should use `useAppI18n()` from `@/i18n/client`
- server/SSR code should use `next-intl/server` APIs such as `getTranslations`, `getLocale`, and `getMessages`
- non-React helpers should take `locale` explicitly and use `translateMessage(...)` from `@/i18n/translate`
- no commented-out code
- no dead legacy branches left beside replacement code
- components must stay narrow in responsibility and move toward `SOLID`, `DRY`, and `KISS`
- touched code should be cleaned up within scope, not only patched minimally
- guest users may calculate and preview workspace surfaces, but notebook/portfolio mutations should be gated behind signed-in access
- shared workspace state helpers belong in `shared/lib/workspace/**`
- display settings such as chart granularity must not change engine truth
- simple-mode projected NBP defaults should be explained and modeled as a flat path from the latest synced rate until overridden

## Key Symbols & Files
- `features/bond-core/application-service.ts`: Central orchestration for all calculation scenarios.
- `features/bond-core/utils/calculations.ts`: The low-level math engine for interest accrual.
- `db/schemas/**`: Grouped schema entrypoints for the database model.
- `lib/data/market-data.ts`: Optimized data retrieval with caching.
- `lib/server/http/api-handler.ts`: Standard API handler wrapper for rate limiting and consistent error handling.
- `lib/server/http/calculation-route.ts`: Shared thin-route helper for calculation endpoints.
- `lib/server/http/read-json-body.ts`: Shared validated JSON-body parsing helper for structured API routes.
- `lib/server/portfolio/service.ts`: Portfolio service boundary used by portfolio API routes.
- `docs/index.md`: Master index for all project documentation.
