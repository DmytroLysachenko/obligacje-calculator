# 26. Full App Refactoring Plan

This document defines the implementation plan for the next major refactor of the **Obligacje Calculator** application. It is based on the current repository structure, existing product documentation, and observed technical risks in the current codebase.

The goal is not to change the product direction. The goal is to make the existing product more correct, more reliable, easier to maintain, and easier to extend.

## Implementation Status

The refactor is partially implemented as of **March 26, 2026**.

Implemented so far:

- shared calculation application service and result envelopes
- scenario typing with warnings, assumptions, calculation notes, and data-quality flags
- chart container hardening and build-clean chart rendering
- notebook ownership split into authenticated and guest-safe access
- compare split into independent and normalized UI modes
- independent compare routed through the shared comparison service contract
- DB-backed multi-asset history endpoint with fallback metadata
- timeline audit metadata for rate source and cycle tracking
- first-year bond rate correction across the full first cycle
- tax and early-redemption settlement fixes for payout versus capitalized bonds
- expanded regression fixtures for rollover, early exit, IKZE, deflation, and rebuy-discount scenarios
- high-traffic i18n cleanup on single, compare, multi-asset, and ladder surfaces
- economic-data screens now surface source, fallback, and as-of metadata
- auth-safe guest portfolio fallback for notebook APIs in local/dev mode
- centralized translation repair/fallback to prevent raw key rendering and repair mojibake at runtime
- shared calculation metadata panels across single and compare result flows
- operational admin sync modes for metadata seed, historical backfill, and incremental market sync
- multi-asset history defaults now derive from DB coverage instead of a hardcoded 2020 baseline

Still remaining:

- broader fixture coverage for missing-data and stale-data edge cases
- fuller freshness/status UX across compare views
- broader mojibake cleanup outside the highest-traffic calculator flows
- worker-based execution path for heavy scenarios
- deeper timing UX unification across single, compare, ladder, and regular-investment forms

## 1. Refactor Goals

The refactor must deliver the following outcomes:

- A single, trusted calculation domain used consistently across UI, API routes, and persistence flows.
- Stronger correctness guarantees for bond calculations, tax handling, inflation lag, rollover logic, and date handling.
- Cleaner screen architecture with less duplicated hook logic and fewer inconsistent client/server execution paths.
- Better runtime reliability when data providers fail or data is stale.
- Better performance for large simulations, chart rendering, and repeated recalculations.
- Clearer boundaries between domain logic, application logic, UI state, and infrastructure.
- A more testable codebase with strong regression coverage for financial edge cases.

### 1.1 Priority Update: Calculation Trustworthiness First

The refactor priorities are updated to reflect the most important real product risks found during implementation and manual review on **March 25, 2026**.

The next phases must prioritize these items before further feature expansion:

- **Separate bond duration from investment horizon.**
  The app must allow a user to hold a 1-year bond for a 5-year or 7-year strategy by explicitly simulating rollover cycles. Bond type selection must not silently reset a longer user-selected horizon back to the native bond duration.
- **Support independent comparison scenarios on `/compare`.**
  The compare experience must support scenarios such as `EDO for 7 years` versus `ROR for 5 years`, with separate withdrawal dates, rollover flags, and assumptions per side. The normalized "same horizon for all bonds" compare mode can remain as a secondary mode, but it cannot be the only compare path.
- **Remove silent macro-data mismatches.**
  Inflation and NBP history currently risk becoming inconsistent because read paths and sync/write paths use different slug conventions. Data access must normalize aliases and surface freshness clearly so variable-rate and inflation-indexed bonds do not quietly fall back to projections.
- **Make compare outputs explainable, not just numerically plausible.**
  Every compare result must expose the rate path, rollover assumptions, inflation assumptions, taxation mode, and whether the result depends on projected or historical data. If a result surprises the user, the explanation should be inspectable directly in the UI.
- **Replace multi-asset mock history with DB-backed history.**
  The multi-asset simulator should use database series when available, with a target historical range of at least `1990-01` onward. Embedded mock series may remain only as an explicit fallback, never as the primary production path.
- **Treat drawdown as a required metric contract.**
  Risk views and asset breakdown cards must always receive populated drawdown data. Missing drawdown values should fail tests and be visible as a data contract bug, not degrade silently in the UI.
- **Finish i18n cleanup on high-traffic calculator screens first.**
  `/single-calculator`, `/compare`, `/multi-asset`, and `/ladder` must not ship mixed hardcoded English copy in otherwise localized flows.

## 2. Current State Summary

The current app already contains the main user-facing flows:

- Dashboard
- Single calculator
- Bond comparison
- Multi-asset comparison
- Regular investment
- Ladder strategy
- Economic data
- Education
- Notebook / portfolio tracking

The current codebase has a solid foundation, but there are structural issues that justify a refactor:

- `features/bond-core/utils/calculations.ts` contains too much orchestration and too many responsibilities in one module.
- Single, regular, and compare flows do not all use one consistent calculation application service.
- `/api/calculate/single` and `/api/calculate/regular` enrich requests with historical data, while `/api/calculate/compare` builds inputs separately and bypasses the same validation path.
- Some calculation flows execute directly in the client, others call API routes, and the execution strategy is not unified.
- Notebook APIs still use a hardcoded mock user id, which is not a stable long-term ownership model.
- Build succeeds, but chart rendering emits a width/height warning that indicates a rendering/layout issue.
- Lint passes with warnings, which points to stale code and partially completed refactors.
- There are visible text encoding issues in some UI strings and localized content.
- The single-calculation UX still risks conflating **one bond cycle** with the **full investment horizon**, which creates misleading charts for short-duration bonds unless rollover is explicit.
- The current `/compare` page implementation can become brittle when the UI expects a different response shape than the route returns, and it does not sufficiently optimize for comparing different horizons per scenario.
- The multi-asset flow still depends primarily on embedded mock monthly returns, which limits date range depth and weakens trust in historical backtests.

## 3. Target Architecture

The refactor should move the app toward four explicit layers.

### 3.1 Domain Layer

This layer contains pure financial logic with no React, Next.js, fetch, or database dependencies.

Responsibilities:

- Bond definitions and rule tables
- Interest accrual logic
- Inflation and NBP reference selection logic
- Tax logic
- Early redemption fee logic
- Rollover / reinvestment logic
- Real return calculations
- Timeline generation

Rules:

- All internal money math must use `Decimal`.
- No UI formatting or display rounding inside the domain layer.
- No raw API or DB objects should enter this layer without normalization.

### 3.2 Application Layer

This layer coordinates requests and composes domain services.

Responsibilities:

- Input normalization
- Validation using shared Zod schemas
- Historical data fetching and enrichment
- Calculation service orchestration
- Warnings and assumptions generation
- Worker-safe and API-safe request handling

Rules:

- All scenario types must use the same service entry pattern.
- API routes and client worker adapters must call the same application service contract.

### 3.3 Interface Layer

This layer contains screen hooks, page containers, component state, and user interactions.

Responsibilities:

- Form state
- Dirty state
- Recalculate triggers
- Loading and error states
- Export/share interactions
- Result rendering

Rules:

- UI hooks should not duplicate domain logic.
- UI hooks should not invent input defaults that conflict with domain definitions.
- Screens should receive typed result envelopes, not raw partial data.

### 3.4 Infrastructure Layer

This layer contains external concerns.

Responsibilities:

- Database access
- External provider access
- Sync jobs
- Route handlers
- Auth integration
- Logging
- Caching

Rules:

- Infrastructure code must not implement business rules.
- Provider failures must return structured stale-data metadata where possible.

## 4. Refactor Workstreams

### 4.1 Workstream A: Calculation Engine Decomposition

Split the current calculation engine into focused modules.

Target modules:

- `engine/input-normalization.ts`
- `engine/timeline-builder.ts`
- `engine/accrual.ts`
- `engine/rate-resolution.ts`
- `engine/tax-settlement.ts`
- `engine/redemption.ts`
- `engine/rollover.ts`
- `engine/real-return.ts`
- `engine/result-assembly.ts`

Expected result:

- `calculations.ts` becomes a thin composition entrypoint instead of a monolith.
- Single and regular investment paths share low-level primitives instead of maintaining similar but separate rule execution.

### 4.2 Workstream B: Shared Scenario Contracts

Introduce stable scenario DTOs shared across hooks, worker execution, and API routes.

Required request models:

- `SingleBondScenarioRequest`
- `RegularInvestmentScenarioRequest`
- `BondComparisonScenarioRequest`
- `MultiAssetScenarioRequest`

Required response envelope:

- `result`
- `warnings: string[]`
- `assumptions: string[]`
- `dataFreshness`
- `calculationVersion`
- `debug` metadata in non-production environments only

Expected result:

- All routes validate the same contracts.
- Compare flow stops bypassing the single/regular enrichment pattern.

### 4.3 Workstream C: Unified Calculation Execution Strategy

Standardize where and how heavy calculations run.

Plan:

- Keep the core engine pure and synchronous.
- Add a worker adapter for expensive interactive UI simulations.
- Keep API routes as thin wrappers that call the same application service.
- Use one decision rule for whether a scenario runs directly in the client, in a worker, or on the server.

Expected result:

- Better UI responsiveness for long timelines and multi-scenario runs.
- No more ad hoc `setTimeout`-based pseudo-background calculation paths.

### 4.4 Workstream D: Screen-Level Refactor

Refactor every major screen to use a shared scenario-controller pattern.

Shared controller responsibilities:

- default input creation
- form updates
- validation state
- dirty state
- calculation execution
- warnings/errors
- export state
- URL sync policy

Screens to refactor:

- Dashboard
- Single calculator
- Compare
- Multi-asset
- Regular investment
- Ladder
- Economic data
- Education
- Notebook

### 4.5 Workstream E: Reliability and Data Freshness

Improve behavior when external or local data is incomplete.

Plan:

- Add freshness metadata to historical data and provider responses.
- Distinguish between fresh, stale, projected, and missing data.
- Surface warnings in result envelopes and UI, not only console logs.
- Add retry and backoff behavior to sync jobs.
- Cache successful provider responses and fall back to last known good data when providers are down.

### 4.6 Workstream F: Quality and Regression Safety

Strengthen the testing strategy around financial correctness and UI reliability.

Plan:

- expand unit tests
- add table-driven edge-case tests
- add API contract tests
- add component tests for screen behavior
- add reference fixtures from official or approved calculation examples

## 5. Calculations Improvements

### 5.1 Core Principles

The calculation engine must follow these principles:

- Deterministic output for the same normalized input.
- Precise internal math using `Decimal`.
- Explicit stage-based rounding rules.
- All domain assumptions exposed to the caller.
- No silent fallback that changes financial meaning without a warning.

### 5.2 Input Normalization Improvements

Before calculation starts, normalize:

- purchase and withdrawal dates
- bond duration and payout mode
- rebuy discount eligibility
- tax strategy
- historical data windows
- inflation assumptions and optional custom yearly inflation arrays

Validation rules to add or tighten:

- withdrawal date cannot be before purchase date
- same-day purchase/withdrawal must be explicitly supported and tested
- withdrawal date after maturity must be normalized according to product rules
- payout frequency must be valid for the selected bond type
- initial investment or contribution amount must be high enough to buy at least one bond unit, otherwise return a zero-unit warning
- reverse goal mode must respect purchasable unit increments

### 5.3 Interest Calculation Improvements

The rate engine should use explicit rule tables by bond type instead of broad conditional branching.

Improvements:

- Make first-year and indexed-year rate selection explicit and testable.
- Separate fixed, NBP-linked, and inflation-linked rules.
- Store per-bond rules for:
  - first period rate source
  - later period rate source
  - inflation lag
  - minimum floors
  - payout/capitalization behavior
- Remove implicit coupling between bond duration and payout period count.

### 5.4 Tax Calculation Improvements

Tax handling needs clearer separation between accrual, withholding, and final settlement.

Improvements:

- Centralize all tax logic in one settlement module.
- Support internal precision independently from legal PLN rounding at official settlement points.
- Prevent double-counting in flows where tax is partially withheld during the lifetime and re-evaluated at exit.
- Make tax strategy behavior explicit for:
  - standard tax
  - IKZE
  - future account wrappers if added later

### 5.5 Early Redemption Improvements

The early withdrawal logic must be rule-driven and isolated.

Improvements:

- Keep OTS rules separate from retail multi-year bonds.
- Apply fee caps consistently so the nominal principal is not reduced where prohibited.
- Support partial-period handling without mixing it into unrelated rate logic.
- Expose fee explanations in the result warnings or metadata where applicable.

### 5.6 Rollover and Reinvestment Improvements

Rollover is currently one of the highest-risk areas because it crosses cycle boundaries.

Improvements:

- Isolate cycle result settlement from next-cycle purchase logic.
- Track carryover cash as a first-class value, not as an incidental leftover.
- Keep principal reset, accumulated interest reset, and rebuy discount activation explicit.
- Ensure subsequent cycles reuse correct bond pricing and fresh cycle assumptions.

### 5.7 Real Return Improvements

Real-value calculations should be consistent across all scenarios.

Improvements:

- Standardize how cumulative inflation is applied over time.
- Clearly distinguish:
  - historical inflation
  - projected inflation
  - user-defined custom inflation
- Prevent mixed historical/projected periods from being represented without a warning.
- Make CAGR and real annualized return formulas consistent across scenario types.

## 6. Calculation Edge Cases

The refactor must explicitly cover the following edge cases.

### 6.1 Date and Time Edge Cases

- purchase date equals withdrawal date
- withdrawal one day before maturity
- withdrawal exactly on maturity
- withdrawal after maturity
- leap years
- February month-end purchases
- month-end rollover behavior
- partial first period
- partial final period
- zero-day holding period

### 6.2 Bond-Type Edge Cases

- OTS early withdrawal with full interest loss
- ROR when NBP reference rate is zero or negative
- indexed bonds during deflation
- indexed bonds with missing lagged inflation value
- instruments with monthly payout versus yearly payout versus maturity payout
- invalid payout frequency selected for bond type

### 6.3 Investment Amount Edge Cases

- contribution too small to buy any unit
- initial investment that leaves non-trivial leftover cash
- rebuy discount creating a purchasable unit count different from nominal-price calculation
- large simulations with many lots
- zero matured liquidity in regular investment reinvestment steps

### 6.4 Tax and Fee Edge Cases

- taxable base below zero after fee deduction
- tax withheld during the term and again at exit
- legal full-PLN rounding boundaries
- fee capped by earned interest
- fee plus tax interaction on early withdrawal

### 6.5 Data Availability Edge Cases

- no historical data in DB window
- partial DB coverage for inflation but not NBP
- stale external data
- projected data used because lagged data is unavailable
- user-supplied historical override partially covering the required timeline

### 6.6 Scenario Logic Edge Cases

- reverse goal mode with unit-based rounding
- rollover across more than one full cycle
- regular investment with maturity and contribution in the same step
- regular investment ending before some lots mature
- comparison scenarios with inconsistent assumptions across bonds

## 7. Screen-by-Screen Refactor Plan

### 7.1 Dashboard

Refactor goals:

- Keep it lightweight and mostly static.
- Surface system health indicators such as latest data freshness.
- Reduce oversized client-side animation and keep interaction cost low.

### 7.2 Single Calculator

Refactor goals:

- Move to the canonical single scenario controller.
- Remove hidden logic from the hook where possible.
- Show assumptions, stale-data warnings, and calculation notes alongside results.
- Support more transparent reverse-goal calculations.

### 7.3 Comparison

Refactor goals:

- Replace dual independent single-calculation requests with a real comparison scenario service.
- Normalize data enrichment and validation.
- Ensure same-date, same-tax, and same-inflation assumptions are clearly visible.
- Keep output stable if one leg fails validation.

### 7.4 Multi-Asset Comparison

Refactor goals:

- Normalize date windows across all assets.
- Make fallback behavior explicit when historical data starts later than the selected range.
- Separate nominal/real view toggles from expensive recomputation.
- Fix text encoding issues in asset descriptions.

### 7.5 Regular Investment

Refactor goals:

- Rebuild on the shared lot engine and scenario controller.
- Avoid duplicating concepts already present in single-bond cycle logic.
- Make contribution timing, maturity timing, and reinvestment timing explicit.
- Surface zero-unit contribution periods as warnings if they occur.

### 7.6 Ladder

Refactor goals:

- Build on the same investment primitives as regular investment.
- Define ladder-specific configuration separately from low-level lot behavior.
- Remove any parallel logic that recomputes outcomes differently from the canonical engine.

### 7.7 Economic Data

Refactor goals:

- Show provider freshness and stale warnings.
- Explain missing data periods in the UI instead of leaving gaps unexplained.
- Keep chart rendering stable in hidden/resized containers.

### 7.8 Notebook

Refactor goals:

- Remove hardcoded mock-user ownership logic.
- Define guest mode versus authenticated mode explicitly.
- Replace raw DB-shaped responses with view models where useful.
- Improve loading, empty, and failure states.
- Keep list view and details view separated from mutation logic.

### 7.9 Education

Refactor goals:

- Keep as low-risk static content.
- Consolidate glossary, tooltip, and content-card patterns.
- Fix copy and encoding issues.

## 8. Performance Improvements

### 8.1 Calculation Performance

- Memoize derived chart series and summary blocks.
- Avoid full recalculation for pure display toggles like nominal versus real view when possible.
- Move heavy scenarios to a worker adapter.
- Reduce repeated date parsing inside hot loops.
- Reuse normalized bond rule definitions instead of re-deriving them repeatedly.

### 8.2 Rendering Performance

- Fix chart container sizing to eliminate width/height warnings during build.
- Avoid rendering large chart components before container dimensions are ready.
- Use progressive loading for non-critical dashboard and education visuals.
- Reduce unnecessary re-renders caused by unstable hook state objects.

### 8.3 Data Performance

- Cache historical data lookups for common date windows.
- Reuse series-id lookups instead of querying identifiers repeatedly.
- Add response caching to provider-backed chart endpoints.
- Avoid duplicating historical data merging logic across routes.

## 9. Reliability Improvements

### 9.1 Error Handling

- Replace broad catch-all failures with structured error categories:
  - validation error
  - calculation error
  - provider unavailable
  - stale data fallback
  - unexpected internal failure

### 9.2 Degraded Mode Behavior

- If NBP, GUS, or market providers fail, use last known cached values when available.
- Mark all affected results with a stale-data status.
- Keep calculators functional when projected assumptions can safely replace missing live data.

### 9.3 Data Integrity

- Ensure API routes never return raw invalid partial data after enrichment.
- Add integrity checks for historical data windows and series coverage.
- Add migration-safe contracts for notebook and portfolio data.

### 9.4 Observability

- Add structured logs for:
  - calculation exceptions
  - provider sync failures
  - notebook API failures
  - stale-data fallbacks
- Add a calculation version string so regressions can be traced to engine revisions.

## 10. Testing Plan

### 10.1 Unit Tests

Add or expand tests for:

- rate determination
- tax settlement
- redemption fee logic
- rollover behavior
- real-return calculations
- date normalization

### 10.2 Table-Driven Edge-Case Tests

Create reference tables covering:

- each bond type
- each payout model
- early withdrawal cases
- deflation / zero-rate cases
- rebuy discount cases
- regular investment lot timing cases

### 10.3 API Contract Tests

Add tests ensuring:

- all scenario routes use the same validation strategy
- all routes return typed result envelopes
- all error responses have consistent structure

### 10.4 UI and Component Tests

Add tests for:

- dirty state and recalculate behavior
- warning rendering
- empty and error states
- chart fallback states
- notebook create/load/select flows

### 10.5 Regression Fixtures

Maintain approved fixtures for:

- official or documented bond examples
- known historical scenarios
- edge cases that previously failed

## 11. Implementation Phases

### Phase 1: Foundation

- Extract calculation submodules.
- Introduce shared scenario DTOs.
- Introduce result envelope contract.
- Add initial regression fixtures.

### Phase 2: Route and Service Unification

- Refactor calculation routes to use one application service pattern.
- Standardize historical data enrichment and freshness metadata.
- Remove comparison-route divergence.

### Phase 3: Screen Refactor

- Migrate single calculator and regular investment first.
- Migrate comparison and ladder next.
- Migrate multi-asset and economic data afterward.
- Refactor notebook ownership and data contract last if auth changes are larger.

### Phase 4: Performance and Reliability Hardening

- Add worker execution path.
- Add provider fallback and caching improvements.
- Fix chart sizing issues.
- Remove lint warnings and stale code paths.

### Phase 5: Final QA

- Run full regression tests.
- Verify calculation parity against approved fixtures.
- Verify stale-data UX behavior.
- Verify mobile and desktop rendering of all major screens.

## 12. Acceptance Criteria

The refactor is complete only when all of the following are true:

- All calculators use the same domain/application service boundary.
- Comparison no longer bypasses canonical validation and enrichment.
- Major financial edge cases have automated coverage.
- Results include warnings and assumptions where needed.
- Build has no chart-size warning.
- Lint has no stale warnings.
- Notebook no longer relies on a hardcoded mock user id for its long-term ownership model.
- Text encoding issues are removed from visible UI content.
- Performance is improved or at minimum not regressed for large scenarios.
- The codebase is easier to extend with new bond definitions and future account wrappers.

## 13. Notes for Implementation

- Preserve existing product scope. This refactor is structural, not a product pivot.
- Preserve the existing documentation set and use this plan as the execution reference for technical work.
- Treat the financial engine as the highest-risk area. Correctness and regression safety take priority over cosmetic cleanup.
- Avoid mixing UI cleanup with domain changes in the same PR wherever possible.
- Prefer incremental migration behind stable interfaces instead of a large rewrite in one step.
