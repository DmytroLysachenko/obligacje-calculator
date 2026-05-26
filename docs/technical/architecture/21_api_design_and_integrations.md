# 21. API Design & Integrations

This document describes the **current retained API surface** and the real external integrations behind it.

It replaces the older abstract design that no longer matched the application.

## 1. Current Internal API Groups

The retained app now exposes several practical route families:

- calculator routes
- chart/reference routes
- notebook/portfolio routes
- sharing routes
- sync/support routes

Current route-handling rule:

- `app/api/**/route.ts` should parse requests, apply auth/validation, and shape responses only
- DB reads belong in `lib/data/**`
- server-side orchestration, mutations, admin logic, and sync triggers belong in `lib/server/**` or `lib/sync/**`

## 2. Calculator APIs

### 2.1 `POST /api/calculate/single`

Purpose:

- run one committed single-bond scenario

Input:

- validated `BondInputs`

Output:

- `SingleBondCalculationEnvelope`

Current expectations:

- this is the flagship retained calculator API
- result screens, chart adapters, CSV export, and audit panels should all derive from the same committed output model

### 2.2 `POST /api/calculate/compare`

Purpose:

- run comparison scenarios

Supported modes:

- normalized comparison
- independent/shared-base comparison

Current expectations:

- comparison remains a scenario-check surface, not a recommendation engine
- inflation controls, advanced yearly inflation, and shared assumptions must stay wired to the actual calculation payload

### 2.3 `POST /api/calculate/regular-investment`

Purpose:

- run recurring purchase scenarios

Current expectations:

- retained route
- should share calculation primitives with the single calculator where possible

### 2.4 `POST /api/calculate/ladder`

Purpose:

- run ladder-style recurring/clustered maturity scenarios

### 2.5 `POST /api/calculate/portfolio`

Purpose:

- run notebook portfolio simulations from owned lots

## 3. Bond Metadata APIs

### 3.1 `GET /api/bond-definitions`

Purpose:

- return the currently resolved bond-definition map used by retained calculators

Current design:

- prefers DB-backed bond metadata
- still has bootstrap-code fallback behavior when DB coverage is missing
- active current-offer defaults are now resolved from the latest applicable `bond_series` rows when available, instead of reading only family-level `polish_bonds` numeric terms

Important product truth:

- current offer terms and current NBP reference rate are not the same concept
- the runtime resolver must keep those separate

### 3.2 `GET /api/calculate/bond-series?symbol=...`

Purpose:

- return the issued series available for a bond family

Current retained UX usage:

- single calculator
- comparison flows where issued-series context matters

## 4. Chart and Reference APIs

### 4.1 `GET /api/charts/inflation`

Purpose:

- return chart-ready CPI history plus source/freshness metadata

Current truth model:

- retained CPI source is the official monthly GUS archive
- fallback or partial coverage must remain visible if it appears

### 4.2 `GET /api/charts/nbp-rate`

Purpose:

- return chart-ready NBP reference-rate history plus source/freshness metadata

Current truth model:

- official NBP data is used where the active path can provide it
- curated historical support coverage fills gaps where direct historical API coverage is insufficient
- the route must clearly mark synced vs partial vs fallback-supported context

### 4.3 `GET /api/charts/...`

Other chart endpoints still exist for retained or secondary surfaces, but the same trust rule applies:

- every chart should carry enough metadata to explain source, as-of date, and coverage honestly

## 5. Notebook / Portfolio APIs

### 5.1 `GET /api/portfolio`

Purpose:

- list portfolio records available to the current resolved owner context

Current retained expectation:

- guest flows may still read preview-compatible portfolio state
- mutating notebook/workspace actions should be gated behind signed-in portfolio access

### 5.2 `POST /api/portfolio`

Purpose:

- create a notebook portfolio

### 5.3 `DELETE /api/portfolio?id=...`

Purpose:

- delete an owned portfolio

Current retained expectation:

- the notebook UI must update immediately after deletion
- selection state must be cleared if the deleted portfolio was active

### 5.4 `POST /api/portfolio/lots`

Purpose:

- add a lot to a portfolio

### 5.5 `PATCH /api/portfolio/lots/[id]`
### 5.6 `DELETE /api/portfolio/lots/[id]`

Purpose:

- update or remove notebook lots

### 5.7 `GET /api/portfolio/summary`

Purpose:

- return notebook summary data for owned portfolios

### 5.8 `POST /api/portfolio/simulate`

Purpose:

- run simulation from notebook-held lots

### 5.9 `POST /api/portfolio/share`

Purpose:

- toggle public sharing on a notebook portfolio

### 5.10 `GET /shared-portfolios/[shareId]`

Purpose:

- read-only public portfolio page

## 6. Admin and Sync Support APIs

### 6.1 `GET /api/admin/status`

Purpose:

- return the current admin health snapshot for tracked data series

Current design:

- route stays thin
- status aggregation lives in `lib/server/admin/status.ts`
- auth check lives in `lib/server/admin/auth.ts`

### 6.2 `POST /api/admin/sync`

Purpose:

- trigger one allowed operational sync or seed mode

Current design:

- route stays thin
- mode routing lives in `lib/server/admin/sync.ts`
- default engine creation is centralized in `lib/sync/create-sync-engine.ts`
- background sync logging is normalized through `lib/sync/sync-logger.ts`

## 7. Single-Scenario Sharing APIs

### 7.1 `POST /api/scenarios/share`

Purpose:

- create a persisted share snapshot for a committed single-bond scenario

Important design decision:

- single-calculator sharing is **not** query-param reconstruction anymore
- it is a stored snapshot

Why:

- dirty input state and committed result state must stay separate
- a shared link should replay one known scenario, not leak whatever happened to be in the form

### 7.2 `GET /shared-scenarios/[shareId]`

Purpose:

- replay a saved single-bond scenario snapshot

Current behavior:

- loads persisted inputs
- re-runs the calculation path in the shared page
- presents the scenario as a saved replay surface
- deliberately does not piggyback on ad hoc query-param reconstruction

## 8. External Integrations

## 8.1 Official bond offer pages

Primary purpose:

- current bond-family and issued-series offer terms

Examples:

- current first-period rates
- series codes
- family descriptions
- sell windows

Current truth rule:

- `obligacjeskarbowe.pl` is the main reference for current offer terms

## 8.2 GUS CPI archive

Primary purpose:

- monthly Polish CPI history for retained calculator/reference surfaces

Current truth rule:

- official monthly GUS archive is the active retained CPI writer
- annual World Bank CPI is no longer an active parallel writer for retained CPI semantics

## 7.3 NBP sources

Primary purpose:

- NBP reference-rate context
- gold price support where still needed

Current truth rule:

- direct NBP API is used where it works
- curated historical support is used where direct historical coverage is not enough
- the UI must say so clearly
- retained economic-data and calculator-context surfaces should describe this as reference coverage, not pretend it is a complete official historical archive

Important product rule:

- do not confuse:
  - bond first-period offer rate
  - NBP reference rate

These are related but not identical.

## 8. Response Envelope Policy

Retained internal APIs should use the shared `ApiResponse<T>` envelope:

- `data`
- `error`
- `meta`

Why:

- notebook/portfolio client parsing was previously too inconsistent
- response-shape guessing caused real UI bugs

Client rule:

- retained clients should unwrap `ApiResponse<T>` consistently
- avoid route-specific raw-array assumptions

## 9. Current Sync Model

### 9.1 Opportunistic/local sync

The app still supports opportunistic sync behavior, but recovery-mode UI should remain calm and truthful.

The sync system should distinguish:

- success
- partial
- stale
- failed

and expose that in:

- `data_series.last_sync_status`
- reference-page metadata
- calculator context panels

### 9.2 Ingestion expectations

For retained routes:

- CPI should have one clear writer
- NBP history should not silently collapse to a single point
- current offer terms should not depend on stale hardcoded constants when synced DB terms exist
- chart/table/export adapters for a calculator should all read from one normalized display model, not parallel route-specific transformations

## 10. Current Known Limitations

These are still real limitations and should remain explicit:

- not every issued bond series across all history is modeled with full historical depth yet
- NBP historical support is stronger than before, but it is still partly curated rather than derived from one perfect archive endpoint
- some secondary surfaces still rely on fallback/reference semantics more than ideal

## 11. API Design Decisions to Preserve

1. Single-scenario sharing stays server-backed and committed.
2. Notebook and single-scenario sharing stay separate concerns.
3. `ApiResponse<T>` remains the preferred route contract for retained internal APIs.
4. Every chart/reference route should expose enough metadata for truthful source/freshness display.
5. External-source ambiguity should never be hidden behind polished UI wording.
6. Guest notebook/workspace visibility does not imply guest mutation access; mutating actions should remain explicitly gated.
