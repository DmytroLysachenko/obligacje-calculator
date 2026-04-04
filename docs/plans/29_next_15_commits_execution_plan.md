# 29. Next 15 Commits Execution Plan

This document defines a realistic next sequence of approximately **15 commits** for improving the application across product UX, calculation correctness, backend logic, database maturity, and operational data freshness.

It is intentionally scoped as an execution plan rather than a vision document. Each item should be shippable in a focused commit or a very small PR.

The plan assumes the current state reflected by:

- the shared bond calculation engine already being in place
- compare, regular-investment, ladder, notebook, and multi-asset screens already existing
- production sync and seed scripts already present but still needing stronger operationalization
- the remaining gaps being mostly around consistency, explainability, data freshness, and final hardening

## Planning Principles

The next commits should follow these rules:

- prioritize trust in calculation output before adding broad new surface area
- keep UI polish separated from financial logic changes where possible
- prefer DB-backed and sync-backed data paths over hardcoded fallback values
- make freshness, warnings, and assumptions visible to the user and operator
- expand the schema only when it directly supports real product behavior
- leave the app more testable and easier to operate after every commit

## Commit Sequence

### Commit 1. Unify Calculator Timing Controls

**Goal**

Bring `single-calculator`, `compare`, `regular-investment`, and `ladder` onto one timing vocabulary and one control model.

**Scope**

- standardize `general` versus `exact` timing mode labels
- align purchase date, horizon, and withdrawal date behavior
- remove flow-specific wording drift
- keep advanced exact-date behavior, but default all entrypoints to the simpler general mode

**Why first**

This reduces user confusion immediately and removes a major source of inconsistent scenario setup before more logic changes land.

**Acceptance**

- all major calculator pages expose the same timing terms
- switching between pages does not change the meaning of similar fields
- no calculator silently resets horizon logic in confusing ways

### Commit 2. Introduce Shared Calculator Page Shell

**Goal**

Create a reusable page shell for calculator-style screens.

**Scope**

- unify page header, status badge, controls column, results column, and recalculate action
- apply first to `compare` and `regular-investment`
- prepare it for later reuse on `ladder`, `multi-asset`, and `notebook`

**Why now**

It lowers UI fragmentation and makes future UX improvements land once instead of per screen.

**Acceptance**

- compare and regular-investment share the same layout primitives
- loading, error, empty, and recalculation states feel consistent

### Commit 3. Deepen Result Explainability Panels

**Goal**

Expose more of the calculation reasoning directly in the result UI.

**Scope**

- show rollover decisions more explicitly
- show tax treatment summary per scenario
- show early withdrawal fee treatment clearly
- surface historical versus projected macro segments in result metadata

**Why now**

The app already calculates more correctly than before, but users still need to see why the numbers look the way they do.

**Acceptance**

- single and compare result screens expose structured assumptions and warnings
- suspicious outputs become inspectable without reading code

### Commit 4. Finish Calculation Fixture Expansion

**Goal**

Add the next batch of high-value regression fixtures before deeper logic work continues.

**Scope**

- add missing-data and stale-data scenarios
- add more fee/tax interaction cases
- add more multi-cycle rollover cases
- add snapshotable expected envelope metadata where useful

**Why now**

This protects the next logic commits from quietly regressing financial behavior.

**Acceptance**

- fixture coverage increases for calculation edge cases not currently locked down
- new failures identify business-rule regressions, not just raw numeric drift

### Commit 5. Repair Local Test Execution and Gate Critical Suites

**Goal**

Make the regression suite runnable in a stable local workflow and ready for CI enforcement.

**Scope**

- resolve the `vitest` local startup problem
- separate critical domain suites from optional UI suites if needed
- ensure bond-core regression tests become a mandatory verification path

**Why now**

A production-facing finance app should not rely on "build passed" as the main correctness signal.

**Acceptance**

- local test command runs reliably
- core financial suites are easy to execute and document

### Commit 6. Expand DB Schema for Data Freshness and Sync Auditing

**Goal**

Add the database fields and tables needed to track source freshness and sync quality explicitly.

**Scope**

- add sync run metadata if missing
- store per-series source, as-of date, covered date range, and sync status
- prepare room for provider error summaries and stale markers

**Why now**

The app already has sync scripts, but operations remain harder than they should be because the DB contract does not surface enough health information.

**Acceptance**

- the schema can answer "what data do we have, how fresh is it, and what failed last"
- future freshness UI no longer depends on inferred state

### Commit 7. Add Deterministic Seeders for Core Macro and Bond Metadata

**Goal**

Make seeding reproducible and explicit for local, staging, and production-like environments.

**Scope**

- unify bond metadata seeding
- unify CPI / NBP / market-series baseline seeding
- make seeding idempotent
- emit coverage summaries after seed runs

**Why now**

Without deterministic seeds, debugging calculation accuracy and freshness issues stays slow and inconsistent.

**Acceptance**

- repeated seed runs do not corrupt or duplicate baseline data
- developers can set up a representative DB state from one documented path

### Commit 8. Build User-Facing Data Freshness System

**Goal**

Show real freshness and fallback state across the app, not just on economic-data pages.

**Scope**

- add freshness badges/messages to calculator result metadata
- show whether rates are historical, projected, fallback, or stale
- add a shared freshness component usable across pages

**Why now**

Trust in calculation output depends as much on source transparency as on the formula itself.

**Acceptance**

- users can see data age and fallback state where results are consumed
- compare surfaces freshness differences per scenario

### Commit 9. Harden Provider Sync Pipeline

**Goal**

Make the sync system production-usable rather than just script-available.

**Scope**

- standardize provider response normalization
- add retry/backoff and structured error logging
- persist inserted/updated/skipped counts
- make partial failures explicit instead of quiet

**Why now**

The project already depends on external data. The next maturity step is operational trust.

**Acceptance**

- sync runs produce a human-readable and machine-readable summary
- provider failures leave a recoverable and debuggable trail

### Commit 10. Replace Remaining Hardcoded Market Fallbacks on Primary Paths

**Goal**

Ensure main simulations prefer DB-backed data everywhere meaningful.

**Scope**

- audit `multi-asset`, chart endpoints, and any remaining direct constants
- keep fallback datasets only as explicit degraded-mode support
- expose when fallback mode was used

**Why now**

The app already contains DB and provider infrastructure, so continuing to rely on hidden hardcoded paths weakens credibility.

**Acceptance**

- primary calculation/history flows read from DB-backed sources first
- fallback usage is visible and exceptional

### Commit 11. Polish Chart UX for Long-Range Analysis

**Goal**

Make long-horizon views readable and consistent.

**Scope**

- unify range presets
- standardize tooltip and legend behavior
- improve empty/loading/fallback states
- verify responsive behavior for long series and mobile screens

**Why now**

Once freshness and DB-backed history are clearer, chart polish has more value because users can trust what they are exploring.

**Acceptance**

- inflation, NBP, compare, and multi-asset charts behave consistently
- charts remain usable on large windows and smaller viewports

### Commit 12. Improve Notebook Onboarding and Portfolio Recovery Flows

**Goal**

Make the notebook feature usable for both guest and signed-in states.

**Scope**

- improve empty state and onboarding copy
- clarify guest versus authenticated persistence behavior
- strengthen recovery paths when saved data is missing or partially invalid

**Why now**

The notebook is already present; it now needs polish to feel reliable rather than provisional.

**Acceptance**

- first-time notebook users understand what the feature stores
- failure states are actionable instead of vague

### Commit 13. Add Scenario Presets and Saved Calculation Templates

**Goal**

Improve practical usability of the main calculators.

**Scope**

- add a small set of curated scenario presets
- allow reusing recent or named calculator configurations
- keep presets compatible with the canonical scenario contracts

**Why now**

This is a high-leverage UX improvement that builds on the now-cleaner timing model and shared page shell.

**Acceptance**

- users can start from meaningful examples instead of blank forms
- repeat calculations require less manual form entry

### Commit 14. Add Admin/System Status View for Data Coverage

**Goal**

Provide an operator-focused way to inspect sync health and data coverage.

**Scope**

- show latest sync run summaries
- show provider health and latest successful refresh time
- show series coverage ranges and stale/problem flags
- keep it simple and read-only first

**Why now**

Once freshness is part of the product, the app also needs an operational screen for maintaining it.

**Acceptance**

- operators can quickly identify stale sources and incomplete coverage
- troubleshooting no longer requires reading logs or DB rows directly

### Commit 15. Reconcile Docs, Scripts, and Production Readiness Checklist

**Goal**

Close the loop between implementation and documentation.

**Scope**

- update roadmap/backlog documents
- document seed/sync/test commands clearly
- add a short production-readiness checklist for data, tests, and fallback behavior

**Why last**

This commit should describe the new reality after the previous 14 changes, not the intended one.

**Acceptance**

- docs match the implemented system
- a contributor can understand how to seed, sync, test, and inspect the app without reverse-engineering the repo

## Optional Extensions If Velocity Is High

If the team moves faster than expected, the next items after the first 15 commits should be:

1. PDF/export redesign with cleaner report formatting and localized copy
2. account-wrapper expansion beyond current tax modes
3. deeper compare presets for "same capital / different horizon" and retirement-planning journeys
4. background scheduled sync orchestration with visible last-run outcome in the UI
5. richer educational linking from result explanations into `/education`

## Recommended Grouping Into 4 Milestones

### Milestone A. Trust and Consistency

Commits `1-5`

- timing consistency
- shared shell
- explainability
- regression safety
- reliable test execution

### Milestone B. Data and DB Maturity

Commits `6-10`

- schema expansion
- deterministic seeding
- freshness system
- sync hardening
- fallback reduction

### Milestone C. Product Polish

Commits `11-13`

- chart polish
- notebook polish
- scenario presets

### Milestone D. Operability and Closure

Commits `14-15`

- admin/system status
- docs and production readiness reconciliation

## Recommended Order If Only 10 Commits Fit

If capacity is closer to 10 commits than 15, stop after:

1. timing unification
2. shared page shell
3. explainability panels
4. fixture expansion
5. test execution repair
6. DB freshness schema
7. deterministic seeding
8. user-facing freshness system
9. sync hardening
10. fallback-path reduction

That sequence gives the strongest improvement in trust, correctness, and production readiness per unit of effort.
