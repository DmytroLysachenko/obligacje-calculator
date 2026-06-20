# 28. Project Map

This map defines where code belongs and which layer owns each responsibility.
Use it before adding files or moving logic.

## Runtime Entry Points

- `app/`: Next.js route segments, layouts, metadata, API controllers, and thin page clients.
- `app/api/**/route.ts`: HTTP controllers only. They parse input, resolve auth/ownership, call server services, and return shared response helpers.
- `features/**`: product workflows grouped by domain surface. Components render workflows; hooks own UI state; `lib` folders own feature-local pure models.
- `shared/**`: browser-safe primitives reused by multiple features: components, hooks, clients, display helpers, formatters, workers, and persistence helpers.

## Server And Data Layers

- `lib/server/**`: server-only application services, route helpers, auth helpers, commands, queries, sync orchestration, and page-read services.
- `lib/data/**`: read models, repositories, market-data caches, and source-neutral data access.
- `lib/api-clients/**`: external provider adapters that talk to public APIs and convert responses into internal records.
- `lib/sync/**`: CLI sync orchestration, seed scripts, provider sync services, and sync history writing.
- `db/**`: Drizzle schema, migrations, seed data, and low-level database connection code.

## Domain Ownership

- `features/bond-core/**`: calculation truth, schemas, scenario handlers, validation, domain errors, and financial regression tests.
- `features/comparison-engine/**`: comparison workflows, comparison-specific display models, chart/table composition, and comparison persistence.
- `features/single-calculator/**`: single-bond calculator UI, single scenario sharing, notebook save action wiring, and single-route display.
- `features/notebook/**`: portfolio workspace UI, portfolio details, notebook commands through `portfolio-client`, and notebook-specific contracts.
- `features/regular-investment/**`, `features/ladder-strategy/**`, `features/retirement/**`: retained strategy surfaces with feature-local hooks and components.

## Boundary Rules

- Browser API calls belong behind `shared/lib/*-client.ts`, `shared/hooks`, or approved workers.
- Route controllers use `lib/server/http/responses.ts` unless they intentionally return non-envelope operational JSON.
- Portfolio writes live in `lib/server/portfolio/commands.ts`; reads and simulations live in `lib/server/portfolio/queries.ts`; public shared-page reads live in `shared-page-service.ts`.
- Pure display logic should sit in `shared/lib` when reused or in `features/**/lib` when feature-local.
- Large components should be reduced by extracting pure models first, then extracting presentational subcomponents.

## Documentation Ownership

- `docs/product/**`: user-facing product intent, support matrix, UX principles, and scope decisions.
- `docs/technical/domain/**`: financial and domain rules.
- `docs/technical/architecture/**`: code architecture, quality gates, deployment, testing, and engineering rules.
- `docs/technical/features/**`: feature behavior and implementation notes.
- `docs/plans/**`: active or recently executed plans. Completed historical plans move to archive only when they no longer guide current work.
- `docs/ui/**`: UI system rules, visual regression contracts, and design migration notes.

## Test Ownership

- Domain math changes require focused `features/bond-core` regression tests.
- API/controller boundary changes require architecture contract tests.
- Display-model changes require pure model tests before UI assertions.
- Docs that define release, architecture, or support status should have a matching contract test when the rule is executable.
