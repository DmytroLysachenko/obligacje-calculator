# Obligacje Calculator

Production-focused simulation platform for Polish treasury bonds, recurring bond plans, comparison scenarios, and reference macro-data.

The current product direction is conservative and trust-first:

- flagship surfaces: `single-calculator`, `compare`, `regular-investment`, `ladder`, `notebook`, `economic-data`
- secondary/reference tools: `multi-asset`, `recovery-lab`, `optimize`, `retirement`
- calculation truth and display consistency take priority over broad feature sprawl

## What The App Does Today

- **Single bond simulation:** Full-cycle bond runs with issued-offer context, rollover handling, tax treatment, and real-value readouts.
- **Scenario comparison:** Structured bond-vs-bond comparison under one committed shared setup.
- **Regular investment and ladder planning:** Repeated purchase modeling for recurring contribution strategies.
- **Workspace notebook:** A records-style portfolio workspace with explicit active-portfolio selection, guest lock states, and save-to-active-portfolio behavior.
- **Economic reference dashboard:** CPI, NBP, source status, and usage guidance grouped as a reference dashboard to support calculator interpretation.
- **Structured exports:** Normalized CSV/PDF/report outputs built from display models, not screenshots.

## Current Architecture

- **Framework:** Next.js 16 App Router + React 19
- **Language:** TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Background jobs:** Inngest
- **Precision math:** `decimal.js`
- **Styling/UI:** Tailwind CSS 4 + Radix UI + Lucide
- **Charts:** Recharts
- **Tests:** Vitest
- **i18n:** `next-intl`

Important code boundaries:

- `app/`: routes, layouts, metadata, thin route/page orchestration
- `features/`: domain-specific UI, calculation handlers, adapters, and product flows
- `shared/components/`: reusable UI grouped by subdomain
- `shared/lib/`: shared display/export/workspace helpers
- `lib/data/`: cached read models and data retrieval helpers
- `lib/server/`: server-only services, repositories, sync/admin orchestration, HTTP helpers
- `db/schema.ts`: canonical Drizzle schema entrypoint
- `db/seed/`: seed modules split by concern

Current production-readiness notes:

- [Current Product Roadmap](./docs/plans/00_roadmap.md)
- [Cloud Run Release Candidate Plan](./docs/plans/08_cloud_run_release_candidate_plan.md)

## Local Development

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Set environment variables in `.env.local` using the deployment documentation and project-specific secrets.
3. Prepare the database if needed:
   ```bash
   npx drizzle-kit generate
   pnpm run db:seed:production
   ```
4. Start the app:
   ```bash
   pnpm dev
   ```

### Quality Checks

```bash
pnpm test
pnpm test:core
pnpm lint
pnpm exec tsc --noEmit
pnpm scan:unused
```

`pnpm scan:unused` should not report confirmed unused files. Export findings are
triaged as API-surface candidates because framework exports, scenario schemas,
and UI primitive barrels can be intentionally retained.

### Data Sync

The repo already contains both the full sync path and a bond-offer-focused operator alias:

```bash
pnpm sync:bond-offers
pnpm sync:full
```

The underlying workflow refreshes:

- current bond offers and issued series
- CPI / macro reference data
- market-history series used by supporting dashboards and secondary tools

For local Inngest development:

```bash
pnpm dev
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Use `INNGEST_DEV=1` locally. Production/cloud signing keys are only needed for deployed Inngest usage.

## Documentation

Start from the central index:

- [Documentation Index](./docs/index.md)

High-value entry docs:

- [Product Vision & Purpose](./docs/product/01_product_vision_and_purpose.md)
- [System Architecture](./docs/technical/architecture/19_system_architecture.md)
- [Database & Data Modeling](./docs/technical/architecture/20_database_and_data_modeling.md)
- [Engineering and Coding Rules](./docs/technical/architecture/26_engineering_and_coding_rules.md)
- [Calculation Stability Rules](./docs/technical/architecture/27_calculation_stability_rules.md)
- [Current Product Roadmap](./docs/plans/00_roadmap.md)
- [Cloud Run Release Candidate Plan](./docs/plans/08_cloud_run_release_candidate_plan.md)

## Deployment Target

The first production-style deployment target is Google Cloud Run. The checked-in
container and build files are:

- `Dockerfile`
- `.dockerignore`
- `cloudbuild.yaml`

Deployment details, required environment variables, migration order, and smoke
checks live in [Deployment & DevOps](./docs/technical/architecture/24_deployment_and_devops.md).

## Product Guardrails

- no hardcoded translated UI copy in code
- no browser-native prompts in product flows
- no display settings that change engine truth
- guest users may calculate and preview workspace surfaces, but portfolio/workspace mutations stay gated behind signed-in access
- secondary tools should remain explicitly demoted and not compete with the flagship calculator flows
