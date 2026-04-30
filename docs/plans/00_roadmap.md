# 00. Current Product Roadmap

This roadmap reflects the real state of the application as of April 30, 2026.

The app is **not production-ready**.

Several calculators exist, but stability, calculation trust, data freshness, UX consistency, and performance are below acceptable release quality. The current priority is not feature expansion. The current priority is **refactor, simplification, and correctness**.

## Current Product Position

- core bond calculation logic exists and can be evolved
- the UI surface area is too large relative to current quality
- some features overshoot the product goal and create confusion
- some pages expose unstable or incomplete behavior
- some live surfaces should be treated as experimental until proven stable
- documentation previously overstated maturity and completion

## Product Reset Direction

The app is being reset around a narrower and clearer goal:

- a reliable Polish treasury bond calculator
- a small set of understandable calculator variants
- educational context that supports the calculations
- transparent data freshness and source quality
- simple, fast, readable screens

The app should **not** behave like a recommendation engine, robo-advisor, or wealth management suite.

## Active Delivery Phases

### Phase 1. Recovery Refactor

Status: `Current`

Goals:

- stop render/update loops
- reduce unnecessary recalculation
- simplify calculator flows
- remove misleading recommendation language
- improve contrast, controls, and readability
- make data source state explicit
- fix stale sync metadata shown in UI
- repair or narrow weak data-backed pages

Primary outputs:

- stable calculator mount behavior
- explicit calculate/recalculate model where needed
- smaller and more predictable input surfaces
- consistent slider/input behavior
- corrected docs and real acceptance criteria
- support matrix of trusted vs experimental pages
- neutral copy in choose-bond and compare-style flows

### Phase 2. Calculation Trust

Status: `Next`

Goals:

- validate each bond type against official rules
- reduce hidden assumptions
- align timing, fee, and tax logic across calculators
- remove or quarantine weak scenarios until verified

Primary outputs:

- audited calculation matrix by bond type
- regression coverage for every supported scenario family
- consistent result contracts across calculators

### Phase 3. Data Reliability

Status: `Next`

Goals:

- fix stale sync status
- expand historical coverage where the feature promises history
- remove pages that rely on weak or mock-like datasets unless clearly labeled
- show actual source, coverage, and freshness for each data series
- make economic-data page usable or intentionally unavailable

Primary outputs:

- trustworthy data status surfaces
- usable economic data page
- market-vs-bonds data coverage extended or feature scope reduced

### Phase 4. Production Narrowing

Status: `Later`

Goals:

- decide which calculators remain in production scope
- archive or hide unstable features
- polish only the set that passes trust and UX thresholds

Primary outputs:

- reduced feature set
- stronger quality bar
- believable release candidate path

## In-Scope Product Surfaces

The likely retained core:

- education
- single bond calculator
- comparison calculator
- regular investment / ladder if calculation rules are verified
- retirement only if rules and scope are narrowed and explained
- economic data only if source/freshness are real and visible

## Out-of-Scope Until Stabilized

- recommendation-style winner language
- broad "smart" advisory UX
- social/community features
- novelty UI layers that add state churn
- extra feature growth before trust/performance recovery

## Roadmap Rule

No feature should be marked done only because UI exists.

A feature is done only when:

- calculations are verified
- behavior is stable
- performance is acceptable
- copy is accurate
- source/freshness state is clear
- docs describe reality
