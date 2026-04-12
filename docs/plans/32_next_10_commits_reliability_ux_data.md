# 32. Next 10 Commits Plan: Reliability, UX, and Richer Data (COMPLETED)

All items in this plan have been successfully implemented.

## Commit Sequence

### [x] Commit 1. Unify Calculator Timing and Scenario Controls
### [x] Commit 2. Introduce a Shared Calculator Page Shell
### [x] Commit 3. Deepen Result Explainability and Reliability Metadata
### [x] Commit 4. Expand Regression Fixtures for Reliability Gaps
### [x] Commit 5. Repair and Gate the Critical Test Path
### [x] Commit 6. Expand DB Schema for Richer Time Series and Sync Freshness
### [x] Commit 7. Build Deterministic Seeders for Core and Expanded Datasets
### [x] Commit 8. Replace Remaining Primary-Path Hardcoded Data with DB Reads
### [x] Commit 9. Build User-Facing Freshness and Sync Status UX
### [x] Commit 10. Apply a Focused UX/UI System Pass to High-Value Screens

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
