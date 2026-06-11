# Service Boundaries

Application routes and page components should stay thin. They may load translations,
metadata, auth/session context, and call server services, but they should not issue
direct database queries.

## Expected Flow

- `app/**/page.tsx` calls a server service.
- `lib/server/**/service.ts` owns business rules, access checks, and orchestration.
- `lib/server/**/repository.ts` owns Drizzle queries and mutations.
- Feature components receive already-shaped data through props or client hooks.
- Sync jobs use `lib/sync/**` orchestration and `lib/server/sync/**` persistence helpers.

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
