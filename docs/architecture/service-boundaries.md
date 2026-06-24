# Service Boundaries

Application routes and page components should stay thin. They may load translations,
metadata, auth/session context, and call server services, but they should not issue
direct database queries.

## Expected Flow

- `app/**/page.tsx` calls a server service.
- `lib/server/**/service.ts` owns business rules, access checks, and orchestration.
- `lib/server/**/repository.ts` owns Drizzle queries and mutations.
- `lib/data/**` is also an approved read-model and repository layer for shared
  source-neutral data access.
- Feature components receive already-shaped data through props or client hooks.
- Sync jobs use `lib/sync/**` orchestration and `lib/server/sync/**` persistence helpers.
- Sync seed scripts may write directly to the database; production sync services
  should keep reusable table access behind repositories or persistence helpers.

## Page Boundary Rules

Page files should be treated as routing adapters, not as application services.
They may:

- read route params;
- load translation helpers;
- call one or more server services;
- choose framework responses such as `notFound()`;
- render feature components with already-shaped props.

They should not:

- import `db` directly;
- import Drizzle table definitions;
- call repository helpers;
- run schema compatibility shims;
- duplicate access checks already implemented in `lib/server/**/service.ts`;
- shape metadata from database records when a server service can own that rule.

Concrete example: `/shared-portfolios/[shareId]` calls
`getPublicSharedPortfolioPageData()` and `buildSharedPortfolioPageMetadata()`.
The service owns schema compatibility, public/private filtering, and the metadata
fallback. The page owns only translations, `notFound()`, and rendering.

## Portfolio Rules

- Portfolio write/export/simulation routes must use
  `getAuthenticatedPortfolioRouteContext()` so guest preview mode cannot mutate
  or extract stored notebook data.
- Portfolio read routes may use `getPortfolioRouteContext()` only when the UI is
  intentionally presenting a guest preview or public read-only surface.
- Public shared portfolio routes must call service functions, not repository
  helpers, so the public/private filtering cannot be bypassed by a page.
- Auth surfaces are OAuth-only. Do not add password or credentials login without
  revisiting storage, reset, throttling, and abuse controls.

## Calculator Rules

- Calculation payloads must contain only calculation inputs.
- Display choices such as chart granularity and context overlays belong in UI
  preference storage, not in calculation schemas.
- Comparison calculations use the same selected horizon for both scenarios and
  auto-roll shorter native terms when needed.

## Sync Rules

- Every production sync path should write a `sync_runs` row.
- Data freshness should distinguish successful sync checks from actual source
  freshness, because CPI and NBP sources do not necessarily publish new values
  every calendar month.
- `SyncEngine` is only an orchestrator. It may sequence macro sync, bond-offer
  sync, provider sync, and full-run summary recording, but it should not contain
  provider fetch loops or table upsert details.
- Provider history ingestion belongs in `lib/sync/services/provider-sync-service.ts`.
  New market providers should implement `SyncProvider` and be added through the
  default engine factory, not hard-coded into page or admin route code.
- Current bond offer scraping/upsert logic belongs in
  `lib/sync/services/bond-offer-sync-service.ts`.
- Sync run persistence and schema compatibility belong in
  `lib/server/sync/run-history.ts`; callers should not write directly to the
  `sync_runs` table.
- Local Windows builds may print the documented Next standalone tracing warning
  for the Inngest route while still exiting successfully. Treat it as an
  operational note unless the build exits non-zero.
