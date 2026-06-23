# 28. Project Map

This map defines where code belongs and which layer owns each responsibility.
Use it before adding files or moving logic.

## Runtime Entry Points

- `app/`: Next.js route segments, layouts, metadata, API controllers, and thin page clients.
- `app/api/**/route.ts`: HTTP controllers only. They parse input, resolve auth/ownership, call server services, and return shared response helpers.
- `features/**`: product workflows grouped by domain surface. Components render workflows; hooks own UI state; `lib` folders own feature-local pure models such as calculator state and dashboard state.
- `shared/**`: browser-safe primitives reused by multiple features: components, hooks, clients, display helpers, formatters, workers, and persistence helpers.

## Server And Data Layers

- `lib/server/**`: server-only application services, route helpers, auth helpers, commands, queries, sync orchestration, and page-read services.
- `lib/server/runtime/env.ts`: centralized runtime environment access. Server
  services and scripts should depend on these helpers instead of reading
  `process.env` directly in multiple places.
- `lib/server/auth/provider-config.ts`: Auth.js runtime configuration boundary.
  It owns OAuth provider discovery, compatibility fallback for `NEXTAUTH_SECRET`,
  and the development-only auth secret fallback.
- `lib/server/readiness/**` and `lib/server/health/**`: operational endpoint services. Routes delegate payload and check construction here.
- `lib/server/admin/status-read-model.ts`: admin status projection for data-series
  point counts, latest data-point coverage, recent sync attempt evidence, and
  environment snapshot fields.
- `lib/data/**`: read models, repositories, market-data caches, and source-neutral data access.
- `lib/data/chart-reference-series.ts` and `lib/data/multi-asset-history.ts`: chart reference envelopes, fallback coverage, stale/partial status decisions, and data-layer fallback builders for chart APIs.
- `lib/api-clients/**`: external provider adapters that convert public API responses into internal records. HTTP transport goes through `lib/sync/http-gateway.ts`.
- `lib/sync/**`: CLI sync orchestration, seed scripts, provider sync services, sync history writing, and the shared sync HTTP gateway.
- `db/**`: Drizzle schema, migrations, seed data, and low-level database connection code.

## Domain Ownership

- `features/bond-core/**`: calculation truth, schemas, scenario handlers, validation, domain errors, and financial regression tests.
  Public calculation entrypoints are exported through `features/bond-core/utils/calculations.ts`, while implementation lives in `features/bond-core/utils/engine/**` by engine family (`single-bond-engine`, `reverse-bond-engine`, `regular-investment-engine`, and shared engine helpers).
- `features/comparison-engine/**`: comparison workflows, comparison-specific display models, chart/table composition, and comparison persistence. Results dashboard ranking and modeled-value decisions live in `features/comparison-engine/components/bond-comparison/results-dashboard-model.ts`.
- `features/single-calculator/**`: single-bond calculator UI, single scenario sharing, notebook save action wiring, single-route display, and pure single-calculator state models.
- `features/economic-data/**`: economic reference charts, dashboard state models for CPI/NBP metadata display, and dashboard section components in `features/economic-data/components/EconomicDashboardSections.tsx`.
- `features/notebook/**`: portfolio workspace UI, portfolio details, notebook commands through `portfolio-client`, notebook-specific contracts, and pure workspace models in `features/notebook/lib/**`.
- `features/optimizer/**`: optimizer UI sections, optimizer state models, and recommendation orchestration. Route/page code should consume `features/optimizer/lib/**` state helpers instead of recomputing readiness or default input rules inline. Input controls belong in `features/optimizer/components/OptimizerInputPanel.tsx`, while the page client owns calculation requests and result state.
- `features/regular-investment/**`, `features/ladder-strategy/**`, `features/retirement/**`: retained strategy surfaces with feature-local hooks and components.

## Boundary Rules

- Browser API calls belong behind `shared/lib/*-client.ts`, `shared/hooks`, or approved workers.
- Route controllers use `lib/server/http/responses.ts` unless they intentionally return non-envelope operational JSON.
- Route JSON bodies use `lib/server/http/read-json-body.ts`; route families with repeated auth/owner behavior use their family controller helpers.
- Calculation route handlers are created through `lib/server/http/calculation-route.ts`;
  they parse with `readJsonBody` and return envelopes with `okJson`.
- Portfolio writes live in `lib/server/portfolio/commands.ts`; reads and simulations live in `lib/server/portfolio/queries.ts`; public shared-page reads live in `shared-page-service.ts`.
- Pure display and state logic should sit in `shared/lib` when reused or in `features/**/lib` when feature-local.
- Large components should be reduced by extracting pure models first, then extracting presentational subcomponents.
- Shared market-assumption UI uses `shared/lib/market-assumptions-form-model.ts` for state/format decisions and `shared/components/market-assumptions/**` for render primitives. Calculator pages should not duplicate CPI/NBP setup-mode logic.
- Operational API routes stay thin. Health, readiness, admin, and sync routes call server services for payloads, mode defaults, DB checks, and command responses.
- Production runtime checks use `scripts/check-production-config.ts` and
  `lib/server/runtime/env.ts`; do not duplicate Cloud Run env validation in
  ad hoc scripts or route modules.
- Chart routes call data-layer envelope helpers for fallback behavior instead of constructing fallback payloads inside route handlers.
- Shared chart components may have companion `*Parts.tsx` files for presentational sections, while pure chart decisions stay in model helpers.
- Sync providers and API clients must not call raw `fetch`; use `lib/sync/http-gateway.ts`.

## Documentation Ownership

- `docs/product/**`: user-facing product intent, support matrix, UX principles, and scope decisions.
- `docs/technical/domain/**`: financial and domain rules.
- `docs/technical/architecture/**`: code architecture, quality gates, deployment, testing, and engineering rules.
- `docs/technical/features/**`: feature behavior and implementation notes.
- `docs/plans/**`: active or recently executed plans. Completed historical plans move to archive only when they no longer guide current work.
- `docs/ui/**`: UI system rules, visual regression contracts, and design migration notes.

## Test Ownership

- Domain math changes require focused `features/bond-core` regression tests.
- Engine file moves require source-contract tests to follow the canonical implementation files, not only the public barrel exports.
- API/controller boundary changes require architecture contract tests.
- Display-model changes require pure model tests before UI assertions.
- UI section splits require contract tests to assert the new component/model ownership when source-level contracts already exist.
- Route boundary changes require contract coverage for body parsing and response envelopes.
- Provider HTTP changes require gateway tests and sync boundary contracts.
- Operational endpoint changes require `app/api/operational-endpoints-contract.test.ts` coverage and focused service tests.
- Admin status changes require read-model tests proving latest data point and
  latest sync attempt remain separate fields.
- Chart fallback/status changes require pure helper tests in `lib/data/**` plus route contract coverage when route ownership changes.
- Docs that define release, architecture, or support status should have a matching contract test when the rule is executable.
