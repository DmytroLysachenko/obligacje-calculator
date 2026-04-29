# 30. Next 15 Commits: Data, Charts, and Calculation Depth (COMPLETED)

All items in this plan have been successfully implemented.

## Commit Sequence

### [x] Commit 1. Define Canonical Simulation Output for Cards, Tables, and Charts
### [x] Commit 2. Expand DB Schema for Chart-Grade Time Series
### [x] Commit 3. Model Simulation Timeline Events Explicitly
### [x] Commit 4. Add Adjustable Chart Granularity to the Simulation Layer
### [x] Commit 5. Build Scenario Variants for Hold, Early Exit, and Reinvestment
### [x] Commit 6. Expand Calculation Coverage for Edge and Non-Edge Cases
### [x] Commit 7. Introduce Shared Chart Query and Transform Layer
### [x] Commit 8. Expand Investment Instruments Available from DB
### [x] Commit 9. Add Source-Aware Sync State and Transitional App-Open Refresh
### [x] Commit 10. Rebuild Bond Charting Around Value Curves, Not Just Year Buckets
### [x] Commit 11. Add Unified Table View Under Every Major Simulation Chart
### [x] Commit 12. Improve Chart Interactivity and UX Controls
### [x] Commit 13. Redesign Compare Flow Around Scenario Cards and Multi-Series Charts
### [x] Commit 14. Plan and Apply UX/UI System Pass for Existing Screens
### [x] Commit 15. Reconcile Docs, Data Contracts, and Acceptance Standards

## Recommended Milestones

### Milestone A. Simulation Contract and Coverage

Commits `1-6`

- canonical output
- richer DB model direction
- event modeling
- granularity control
- scenario variants
- broader test coverage

### Milestone B. DB-to-Chart Infrastructure

Commits `7-10`

- shared chart transform layer
- broader instrument catalog
- sync freshness on app open
- value-curve-based bond charts

### Milestone C. UX Delivery

Commits `11-15`

- table views
- chart interactivity
- stronger compare flow
- UX/UI system pass
- docs reconciliation

## What This Plan Explicitly Tries to Prevent

- charts that only show yearly ladders for products needing monthly detail
- calculator-specific data contracts that do not match each other
- market comparisons relying on hidden fallback constants
- fee and tax logic that changes summary numbers without visible timeline traces
- UI screens that look different enough to confuse users about the meaning of controls

## Definition of Success

This plan succeeds if, after these 15 commits:

- users can understand both the result and the path that produced it
- chart and table outputs are both available for major calculators
- bond simulations correctly handle short-on-long and long-on-short horizon cases
- DB models are rich enough to power synchronized charting cleanly
- asset comparison is more credible because instruments and history come from DB-backed sync
- the product feels more interactive and modern without becoming harder to use
