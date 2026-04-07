# 32. Next 10 Commits Plan: Reliability, UX, and Richer Data

This document defines the recommended **next 10 commits** for the application based on the current documentation set and the already established product and technical direction.

It is intentionally narrower than the 15-commit plans. The goal here is to prioritize the highest-leverage work for:

- application reliability
- better UI/UX consistency and clarity
- richer and more trustworthy DB-backed datasets

The sequence below is designed to improve the app where it matters most for a financial product: trust in results, visible data quality, lower interaction friction, and stronger foundations for later comparison and chart work.

## Planning Rule

Each commit should improve at least one of these three areas:

1. calculation and operational reliability
2. UI/UX clarity and consistency
3. database-backed data quality and coverage

If a proposed commit does not strengthen one of those, it should be deferred.

## Commit Sequence

### Commit 1. Unify Calculator Timing and Scenario Controls

**Goal**

Remove inconsistent timing behavior across the main calculators.

**Scope**

- align timing terminology across `single-calculator`, `compare`, `regular-investment`, and `ladder`
- standardize purchase date, horizon, withdrawal date, and rollover behavior
- default to the simpler timing mode while preserving exact-date flows
- remove screen-specific wording drift and hidden assumptions

**Why first**

Users should not have to relearn the meaning of the same control on each page. This is the fastest UX improvement with immediate reliability impact because it reduces incorrectly configured scenarios.

**Acceptance**

- the same timing inputs mean the same thing across major calculators
- longer-horizon and exact-date behavior are explicit rather than inferred

### Commit 2. Introduce a Shared Calculator Page Shell

**Goal**

Create one reusable page structure for calculator-style screens.

**Scope**

- unify page header, metadata/status area, controls panel, result panel, and recalculate flow
- standardize loading, empty, and error states
- apply first to the highest-traffic calculator screens
- prepare the shell for reuse by compare, regular-investment, ladder, and notebook-style analysis views

**Why now**

The product already has enough breadth that inconsistent layouts now create avoidable cognitive overhead.

**Acceptance**

- major calculator pages share the same interaction hierarchy
- status, recalculation, and result transitions feel consistent

### Commit 3. Deepen Result Explainability and Reliability Metadata

**Goal**

Make results easier to trust and easier to inspect.

**Scope**

- surface structured assumptions, warnings, and calculation notes
- show rate source, projected versus historical segments, tax treatment, and fee treatment more clearly
- expand freshness and fallback metadata in result envelopes and UI
- make suspicious results explainable without reading implementation details

**Why now**

A financial app becomes credible when users can inspect why a result looks the way it does, not only when the number is plausibly correct.

**Acceptance**

- single and compare results expose explanation blocks consistently
- fallback, stale-data, and projected-data usage are visible at point of consumption

### Commit 4. Expand Regression Fixtures for Reliability Gaps

**Goal**

Strengthen automated safety around the most failure-prone scenarios.

**Scope**

- add fixtures for stale data, missing data, fee and tax edge cases, and long rollover chains
- validate both summary output and timeline/event correctness
- add coverage for short-on-long and long-on-short horizon cases
- include expected metadata where source/fallback behavior matters

**Why now**

The next reliability and data commits should land under stronger regression protection.

**Acceptance**

- critical calculation paths are covered by deterministic fixtures
- regressions are caught in both financial totals and explanation metadata

### Commit 5. Repair and Gate the Critical Test Path

**Goal**

Make the app's most important verification path reliable for day-to-day development.

**Scope**

- fix local execution issues for the core test workflow
- separate critical financial/domain suites from broader optional suites if needed
- document the default verification path for reliability work
- prepare the critical suites to act as a hard gate in CI

**Why now**

A finance-oriented app cannot rely on successful builds as its main correctness signal.

**Acceptance**

- core calculation tests run reliably in local development
- contributors have a clear mandatory verification path for high-risk changes

### Commit 6. Expand DB Schema for Richer Time Series and Sync Freshness

**Goal**

Make the database fit for chart-grade historical data and source observability.

**Scope**

- enrich series metadata with display precision, chart defaults, freshness policy, source priority, and interpretation rules
- enrich data points with quality flags and market-series fields such as OHLC or adjusted values where relevant
- add or harden sync-run and per-series freshness tracking
- ensure the DB can answer what data exists, how fresh it is, and what failed

**Why now**

The current product direction depends on the DB becoming the system of record, not only a cache of raw values.

**Acceptance**

- DB records support both calculation use and chart use cleanly
- sync freshness and stale-state inspection become first-class capabilities

### Commit 7. Build Deterministic Seeders for Core and Expanded Datasets

**Goal**

Make data setup reproducible while broadening the instrument catalog.

**Scope**

- unify seeding for bond metadata, CPI, NBP, and market/instrument series
- make seeders idempotent and coverage-aware
- prepare clean seed flows for broader comparison instruments and proxies
- emit coverage summaries after seed runs

**Why now**

Richer datasets only help if developers and environments can reproduce them consistently.

**Acceptance**

- repeated seed runs do not duplicate or corrupt baseline data
- local and staging environments can reach a representative DB state from one path

### Commit 8. Replace Remaining Primary-Path Hardcoded Data with DB Reads

**Goal**

Make DB-backed data the default on all important user paths.

**Scope**

- audit remaining hardcoded constants and embedded market paths in primary simulations and chart flows
- move those paths to DB-first reads
- keep fallback datasets only as explicit degraded mode
- expose when fallback data is used and why

**Why now**

The product loses trust whenever a seemingly live comparison still relies on silent embedded values.

**Acceptance**

- main simulation and history paths prefer DB-backed data
- fallback usage is visible, exceptional, and traceable

### Commit 9. Build User-Facing Freshness and Sync Status UX

**Goal**

Expose the quality and age of data in a user-friendly, reusable way.

**Scope**

- add shared freshness badges, source labels, and stale-state messaging
- show whether data is historical, projected, fallback, or stale
- apply the shared status model across calculators, compare views, and economic-data screens
- improve degraded-mode copy so it is informative rather than alarming

**Why now**

Better data is only valuable to users if the app communicates its quality clearly and consistently.

**Acceptance**

- users can see data freshness where results are interpreted
- source and fallback state are consistent across the app

### Commit 10. Apply a Focused UX/UI System Pass to High-Value Screens

**Goal**

Make the app feel more modern, more coherent, and easier to use without changing product scope.

**Scope**

- standardize headers, controls, summaries, charts, tables, and explanation blocks on the highest-value screens
- reduce copy clutter and strengthen visual hierarchy
- improve chart controls, mobile layout behavior, empty states, and result readability
- ensure richer data and reliability metadata integrate cleanly into the interface

**Why last**

This commit should refine the interaction model after the reliability and data foundation is already improved.

**Acceptance**

- the main product screens feel visually and behaviorally coherent
- the app is easier to navigate even though it exposes more depth and more data state

## Recommended Milestones

### Milestone A. Trust and Input Consistency

Commits `1-5`

- timing unification
- shared page shell
- explainability metadata
- regression expansion
- reliable test path

### Milestone B. Data Foundation and Source Trust

Commits `6-9`

- richer DB schema
- deterministic seeders
- DB-first data paths
- user-facing freshness and sync status

### Milestone C. UX Delivery

Commit `10`

- focused UX/UI system pass after the underlying trust model is stronger

## What This 10-Commit Plan Optimizes For

- fewer misleading scenario setups
- stronger confidence in financial outputs
- less silent fallback behavior
- broader and more reproducible DB-backed datasets
- more coherent and lower-friction UX across the app

## What It Intentionally Defers

This plan does **not** prioritize broad new feature expansion first.

It intentionally defers lower-priority work until the app is stronger in:

- calculation trust
- data-source transparency
- UI consistency
- dataset richness
- operational reliability

## Definition of Success

This plan succeeds if, after these 10 commits:

- users can configure major scenarios with less ambiguity
- results are easier to trust because assumptions, freshness, and fallbacks are visible
- the most important financial paths are protected by reliable tests
- the DB becomes the default source for richer comparison and chart data
- the main screens feel more coherent, modern, and usable on both desktop and mobile
