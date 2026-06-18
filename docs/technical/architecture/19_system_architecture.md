# 19. System Architecture

The application is a layered Next.js product. UI code asks for work through shared gateways, API routes act as thin controllers, and financial truth stays in business/domain modules.

## 1. Runtime Layers

### UI and Page Layer

- `app/` contains route segments, layouts, metadata, and thin page orchestration.
- `features/**/components` renders workflows and prepared display models.
- `features/**/hooks` owns UI state transitions, persistence restoration, and user-triggered actions.

Shared browser-facing gateways live under `shared/lib`:

- `api-client.ts` owns fetch behavior, JSON parsing, and API errors.
- `calculation-endpoints.ts` maps `ScenarioKind` to calculation endpoints.
- `portfolio-client.ts` owns migrated portfolio API calls.
- `calculator-state.ts` owns display-only stripping, stable state comparison, and envelope restoration.

`app/api/**/route.ts` files should only:

- parse HTTP input
- resolve auth and ownership context
- validate request shape
- call an application service, command, query, or repository
- return a structured response through shared response helpers

Core financial behavior lives in `features/bond-core`:

- `CalculationApplicationService` sanitizes requests, checks cache, gathers shared context, and dispatches by scenario kind.
- `features/bond-core/handlers/**` contains scenario handlers for each calculator flow.
- The calculation service accepts dependencies for cache, data freshness, bond definitions, and handler lookup so tests can inject narrow fakes.

- `lib/server/**` owns server services, commands, queries, HTTP helpers, auth/ownership helpers, and sync/admin orchestration.
- `lib/server/portfolio/commands.ts` owns portfolio mutations.
- `lib/server/portfolio/queries.ts` owns portfolio reads and simulations.
- `lib/server/portfolio/errors.ts` owns portfolio service error types shared by commands, queries, and routes.
- `lib/data/**` owns shared read models, repository interfaces, and external-data-backed retrieval.
- `db/**` owns schema, migrations, and seed data.

## 2. Main Calculation Flow

1. The user changes calculator inputs in a feature component.
2. The feature hook normalizes UI state and strips display-only values.
3. The hook resolves the endpoint through `getCalculationEndpoint(...)`.
4. `useCalculationRequest` or the shared worker posts the scenario payload.
5. The API route delegates to `CalculationApplicationService`.
6. The service gathers shared context, selects the scenario handler, and returns a `CalculationEnvelope`.
7. The UI renders results through display adapters, chart models, and table models.

Chart granularity is a display setting. It must never become engine input or change calculation truth.

The portfolio stack is moving toward the same boundary model:

- Notebook and migrated portfolio UI code calls `portfolioClient` for workspace operations.
- Portfolio API routes resolve ownership and validate payloads.
- Reads go through `lib/server/portfolio/queries.ts`.
- Mutations go through `lib/server/portfolio/commands.ts`.
- Route error handling imports `PortfolioServiceError` from `lib/server/portfolio/errors.ts`, not the legacy service module.

## 3. Boundary Enforcement

Architecture rules are executable where practical:

- `shared/lib/calculation-endpoints.test.ts` locks scenario endpoint mapping.
- `lib/server/portfolio/portfolio-service-boundary.test.ts` checks portfolio route facade usage.
- `lib/data/bond-definition-repository-contract.test.ts` checks bond definition repository shape.
- `features/notebook/notebook-portfolio-gateway-contract.test.ts` checks notebook portfolio gateway usage.
- `docs/technical/architecture/layer-boundary-contract.test.ts` checks cross-layer endpoint, gateway, route, and response-helper boundaries.

When changing architecture, update both the implementation and the relevant contract test.
