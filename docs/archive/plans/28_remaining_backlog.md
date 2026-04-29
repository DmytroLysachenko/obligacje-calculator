# Remaining Backlog

This document tracks the remaining post-refactor backlog after the major calculation, data-quality, and reliability work landed in `main`.

## Priority 1: Calculator UX Consistency

### 1. Timing UX Unification
- Standardize `general` vs `exact` timing mode across:
  - single calculator
  - compare
  - regular investment
  - ladder
- Default to `general` mode with:
  - purchase date
  - horizon slider / stepper
- Keep `exact` mode as advanced:
  - purchase date
  - exact withdrawal date
- Reuse the same labels, helper copy, and update rules everywhere.

### 2. Shared Page Shell Consistency
- Bring the following screens onto one consistent layout system:
  - compare
  - market vs bonds / multi-asset
  - economic data
  - ladder
  - notebook
- Use one common pattern:
  - page header
  - status badge
  - left controls
  - right results / charts
  - fixed recalculate action

### 3. Chart UX Polish
- Improve long-range chart usability for:
  - inflation
  - NBP rate
  - market vs bonds
  - drawdown views
- Standardize:
  - range presets
  - tooltip behavior
  - legend placement
  - empty / loading / fallback states

## Priority 2: Data Quality and Operations

### 4. Historical Data Backfill
- Run full backfill for:
  - CPI
  - NBP rate
  - S&P 500
  - gold
  - savings proxy inputs
- Confirm the DB coverage actually reaches the target long-range windows.
- Keep fallback mode visible but rare.

### 5. Sync Observability
- Add clearer operator-facing reporting for sync runs:
  - per provider totals
  - inserted / updated / skipped
  - effective covered date range
  - failure summary

## Priority 3: Testing and Explainability

### 6. Runtime Regression Execution
- Resolve the local `vitest` startup `spawn EPERM` problem.
- Run the golden fixture suites in CI / local verification instead of relying only on lint, build, and typecheck.

### 7. Deeper Result Explainability
- Expand UI explanation panels with more structured detail for:
  - rollover decisions
  - rebuy discount application
  - early withdrawal fee treatment
  - projected vs historical macro segments

## Priority 4: Final Copy and Content Cleanup

### 8. Remaining Translation / Copy Cleanup
- Audit lower-traffic screens and helper text for:
  - missing locale entries
  - awkward English fallback copy
  - mojibake regressions

### 9. Notebook UX Polish
- Improve portfolio empty states, onboarding, and recovery flows.
- Add clearer distinction between:
  - guest notebook
  - signed-in notebook

### 10. Final Docs Reconciliation
- Keep:
  - `26_app_refactoring_plan.md`
  - `27_calculation_reliability_remediation_plan.md`
  - this backlog
- synchronized with what is actually implemented.

## Recommended Next Implementation Order
1. Timing UX unification for regular investment and ladder
2. Shared page shell consistency on compare and market-vs-bonds
3. Chart UX polish for long-range views
4. Historical DB backfill execution and sync observability
5. Vitest environment repair

## Production Execution & Data Realism (New)
6. Implement fully featured Drizzle DB schemas (`drizzle/schema.ts`).
7. Implement API-driven seeding of real WIBOR, GUS, and bond issuance data instead of fallback mocks.
8. Validate calculation output purely against real seeded database results to confirm 100% accuracy.
