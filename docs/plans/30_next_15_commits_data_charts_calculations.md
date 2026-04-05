# 30. Next 15 Commits: Data, Charts, and Calculation Depth

This document replaces the previous near-term plan as the main execution reference for the **next 15 commits**.

The emphasis here is not broad feature expansion. The emphasis is:

- improving existing calculators and screens
- preparing database models that are truly usable for charting and synchronized market data
- making charts interactive, granular, and useful for real decision-making
- keeping calculations understandable, testable, and reliable across normal and edge cases
- making bond-vs-other-assets comparison a first-class part of the product

The target user experience is simple:

- every important calculator should be able to return **summary cards**, **table rows**, and **chart points**
- the user should be able to switch period range and chart step without losing clarity
- long bonds held for short windows and short bonds rolled over for long windows should be visualized correctly
- chart output should reflect actual simulation steps, not fake yearly jumps caused by weak sampling

## Working Principles

- keep the financial engine simple internally, but never simplistic in output
- treat chart data as a product contract, not a UI afterthought
- prefer one canonical simulation result shape for cards, tables, and charts
- push synchronized source data into DB first, then build charting and calculations on top of DB reads
- keep degraded mode explicit when live or synced data is missing
- avoid adding new calculators until existing ones become explainable and chart-complete

## Commit Sequence

### Commit 1. Define Canonical Simulation Output for Cards, Tables, and Charts

**Goal**

Create one result contract that every calculator can use.

**Scope**

- define a shared result envelope with:
  - summary metrics
  - timeline points
  - event rows
  - explanation blocks
  - chart metadata
- ensure the same scenario can power both table view and chart view
- include source and freshness metadata in the envelope

**Why first**

Without a canonical output contract, every screen will keep inventing its own chart and table shape.

**Acceptance**

- single, compare, regular-investment, and ladder can target the same result structure
- chart points and table rows come from the same simulation source

### Commit 2. Expand DB Schema for Chart-Grade Time Series

**Goal**

Make the database suitable for chart rendering and historical comparisons, not just raw storage.

**Scope**

- expand `data_series` metadata with:
  - display precision
  - display step defaults
  - timezone or date interpretation mode
  - source priority
  - freshness policy
- expand `data_points` support for:
  - open/high/low/close when relevant
  - adjusted close where relevant
  - volume or liquidity metadata where relevant
  - quality/source flags
- add support for instrument classification useful to chart UIs

**Why now**

The current schema is enough for simple values, but not rich enough for chart tooling or broader instrument comparisons.

**Acceptance**

- DB rows can support both macro charts and market charts cleanly
- frontend chart layers no longer need ad hoc interpretation rules

### Commit 3. Model Simulation Timeline Events Explicitly

**Goal**

Represent calculation events as first-class rows in the domain output.

**Scope**

- add timeline event types such as:
  - purchase
  - rate reset
  - interest accrual checkpoint
  - payout
  - tax settlement
  - early redemption fee
  - rollover purchase
  - maturity
- attach explanatory values to each event
- ensure these events can power table rows and chart annotations

**Why now**

This is the cleanest way to explain cases like:

- 10-year bond held for 3 years
- 1-year bond rolled for 10 years
- reinvestment versus no reinvestment

**Acceptance**

- every important calculation transition can be rendered in both a table and a chart tooltip
- fee and tax logic are inspectable without reverse-engineering the engine

### Commit 4. Add Adjustable Chart Granularity to the Simulation Layer

**Goal**

Support `daily`, `monthly`, `quarterly`, and `yearly` chart steps where appropriate.

**Scope**

- add requested chart step into scenario inputs
- generate timeline series at the chosen step
- avoid fake yearly-only sampling for long products
- make monthly the default for long-horizon bond charts where it adds clarity

**Why now**

This directly addresses the current problem where long bonds can appear as yearly stair steps instead of a meaningful progression.

**Acceptance**

- a 10-year bond can be shown over 3 years with monthly detail
- a 1-year bond simulated over 10 years can show monthly progress across cycles

### Commit 5. Build Scenario Variants for Hold, Early Exit, and Reinvestment

**Goal**

Make the main scenario comparisons explicit and reusable.

**Scope**

- support these modes as canonical variants:
  - hold-to-selected-date
  - early exit
  - rollover with reinvestment
  - no reinvestment
- attach pluses/minuses and assumptions to each variant
- reuse the same structure across single and compare flows

**Why now**

Users do not only want one answer. They want to understand the consequence of different actions on the same instrument.

**Acceptance**

- the app can compare reinvestment versus no reinvestment clearly
- charts and tables can explain how each path evolves

### Commit 6. Expand Calculation Coverage for Edge and Non-Edge Cases

**Goal**

Move toward full coverage of realistic calculation behavior.

**Scope**

- add fixtures and tests for:
  - early exit before meaningful interest accrues
  - exact maturity exit
  - mid-cycle exit
  - rollover across many cycles
  - deflation and low-rate periods
  - missing historical data with fallback
  - short horizon on long bonds
  - long horizon on short bonds
- add expected chart-point and event coverage for selected fixtures

**Why now**

The engine should be trusted not only numerically, but also in how it explains timeline behavior.

**Acceptance**

- edge-case fixtures validate both summary output and timeline/event correctness
- regressions in chart-friendly output are caught automatically

### Commit 7. Introduce Shared Chart Query and Transform Layer

**Goal**

Centralize DB-to-chart transformation logic.

**Scope**

- create one layer that:
  - fetches series from DB
  - aligns date ranges
  - resamples to target step
  - fills gaps according to series rules
  - returns chart-safe structures
- use it for economic-data and multi-asset first

**Why now**

If each screen transforms chart data differently, consistency and correctness will drift again.

**Acceptance**

- chart pages use one DB-backed transform path
- step selection and range logic behave consistently

### Commit 8. Expand Investment Instruments Available from DB

**Goal**

Make comparison with other assets more meaningful using DB-backed instruments.

**Scope**

- add more instruments or proxies that can be seeded and synced into DB
- define metadata for:
  - instrument category
  - base currency
  - risk profile
  - benchmark role
  - chart default visibility
- prepare the UI to consume a larger instrument catalog cleanly

**Why now**

Comparison with other assets is one of the strongest strategic differentiators of the product.

**Acceptance**

- compare and multi-asset screens can draw from a broader DB-backed instrument list
- instruments are modeled cleanly enough for filtering and chart legend behavior

### Commit 9. Add Source-Aware Sync State and Transitional App-Open Refresh

**Goal**

Use the app opening flow as a temporary sync trigger until cron-based automation becomes the default.

**Scope**

- add a lightweight freshness check on app load
- trigger sync only when data is stale or missing
- keep this behavior controlled and explicit
- avoid blocking the UI on a full sync
- record sync outcome in DB metadata

**Why now**

You want near-real data behavior now, and a full cron strategy can come later.

**Acceptance**

- app opening can trigger a safe freshness check
- stale sources are refreshed opportunistically without freezing the UI
- later cron migration remains straightforward

### Commit 10. Rebuild Bond Charting Around Value Curves, Not Just Year Buckets

**Goal**

Show how value evolves inside the chosen horizon rather than only at coarse period boundaries.

**Scope**

- expose chart series for:
  - gross value
  - net value
  - principal
  - earned interest
  - tax paid
  - fee impact
  - real value where relevant
- support toggling these curves on and off
- annotate maturity, rollover, and early-exit points

**Why now**

This makes bond charts actually informative instead of decorative.

**Acceptance**

- charts explain profit formation over time
- users can see where fees and taxes change the curve

### Commit 11. Add Unified Table View Under Every Major Simulation Chart

**Goal**

Make charts auditable through table data.

**Scope**

- add a synchronized table below charts for key calculators
- support column sets based on calculator type
- add filtering by event type and date range
- keep chart hover and table row focus linked where practical

**Why now**

Financial products need auditability. A chart alone is not enough.

**Acceptance**

- every major simulation can be inspected as rows, not only visuals
- users can reconcile chart shape with numeric checkpoints

### Commit 12. Improve Chart Interactivity and UX Controls

**Goal**

Make charts modern, intuitive, and useful without becoming cluttered.

**Scope**

- add period controls
- add chart-step selector
- add nominal versus real toggle where relevant
- add event markers and richer tooltips
- improve mobile behavior and empty/loading states

**Why now**

The product needs to feel dynamic and interactive, not like a static reporting page.

**Acceptance**

- users can change period and step directly from the chart area
- chart interactions remain understandable and responsive on desktop and mobile

### Commit 13. Redesign Compare Flow Around Scenario Cards and Multi-Series Charts

**Goal**

Make bond-vs-bond and bond-vs-other-assets comparisons clearer and easier to use.

**Scope**

- use scenario cards with explicit assumptions
- compare aligned ranges with transparent normalization rules
- show relative and absolute outcome views
- allow charting multiple scenarios with clear legend and tooltip behavior

**Why now**

Comparison is strategically important, and it becomes much stronger once chart-grade data and timeline output exist.

**Acceptance**

- compare screens explain what is being compared and on what assumptions
- users can switch between summary, chart, and table views cleanly

### Commit 14. Plan and Apply UX/UI System Pass for Existing Screens

**Goal**

Make the product feel modern, intuitive, and consistent without changing its core purpose.

**Scope**

- define one consistent pattern for:
  - page header
  - input controls
  - result summary
  - chart block
  - table block
  - explanation block
- simplify language and reduce cognitive overload
- improve interaction hierarchy on high-value screens first

**Why now**

By this point the product will have richer outputs, so UI discipline becomes critical.

**Acceptance**

- major calculators share one coherent interaction model
- the product feels easier to use despite offering more depth

### Commit 15. Reconcile Docs, Data Contracts, and Acceptance Standards

**Goal**

Close the loop after the previous 14 commits.

**Scope**

- update plan docs and architecture notes
- document canonical simulation result shape
- document DB chart-data rules
- document temporary app-open sync behavior
- define what "calculation-complete" and "chart-complete" mean for a calculator

**Why last**

The documentation should describe the final implemented contract, not an intermediate guess.

**Acceptance**

- contributors know how to extend calculators without inventing a new data shape
- product, DB, chart, and sync rules are aligned in docs

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
