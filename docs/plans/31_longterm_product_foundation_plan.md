# 31. Long-Term Product Foundation Plan

This document describes the longer-horizon direction of the product after the next focused execution phase.

It is not a backlog dump. It defines the long-term shape of the platform so short-term commits can be judged against a stable target.

## Long-Term Product Goal

Build a **trusted financial simulation and comparison platform** where users can:

- understand Polish treasury bonds deeply
- compare them fairly with other instruments
- inspect how value evolves over time
- see both chart-level and row-level evidence
- rely on synchronized public-source data stored in the product database

The long-term product should be:

- dynamic and interactive
- simple to understand
- modern but not flashy for its own sake
- educational without feeling heavy
- reliable enough that users trust the numbers and the explanations

## Long-Term Foundation Pillars

### 1. Canonical Financial Engine

The engine should remain:

- pure
- deterministic
- well-tested
- scenario-based
- decoupled from UI and DB concerns

Long-term target:

- one canonical simulation engine for bond, regular investment, ladder, and comparison flows
- one event/timeline output contract reusable everywhere
- one traceable explanation path for rates, taxes, fees, and reinvestment

### 2. Database as the System of Record

The database should become the central source for:

- macroeconomic series
- market/instrument history
- bond offer metadata
- bond issuance series
- sync health and freshness state
- chart-ready transformation metadata
- user portfolio and notebook records

Long-term target:

- charts should be powered from DB-backed and normalized data by default
- provider APIs should feed the DB, not the UI directly
- all critical displays should have a known source, freshness state, and fallback status

### 3. Chart-Complete Product Architecture

Charts should be treated as primary product surfaces, not visual add-ons.

Long-term target:

- every major calculator has summary, chart, and table modes
- chart step and period controls are available where meaningful
- chart event markers explain major timeline transitions
- chart states are reusable across calculators

### 4. Comparison as a Core Advantage

Comparison should become one of the platform's strongest features.

Long-term target:

- compare bonds against bonds
- compare bonds against inflation, cash, gold, equity proxies, and other DB-backed instruments
- support scenario-vs-scenario comparisons, not only instrument-vs-instrument
- keep comparison rules explicit and fair

### 5. Operational Freshness and Sync Discipline

Long-term target:

- sync state is visible
- stale data is marked
- degraded mode is transparent
- app-open freshness checks can later be replaced with cron and background jobs
- provider failures do not silently degrade trust

### 6. UX System for Financial Clarity

Long-term target:

- one coherent interaction model across the product
- low cognitive load
- strong hierarchy between controls, summary, chart, table, and explanation
- consistent language across calculators
- mobile usability without sacrificing desktop depth

## Long-Term Product Stages

### Stage 1. Simulation Integrity

Focus:

- calculation correctness
- edge-case coverage
- event timeline modeling
- unified result contract

The product cannot scale meaningfully until this stage is strong.

### Stage 2. DB and Sync Maturity

Focus:

- richer DB schemas
- provider normalization
- historical coverage expansion
- freshness metadata
- sync observability

This stage turns the product from a locally smart tool into a data-backed platform.

### Stage 3. Chart and Table Experience

Focus:

- adjustable step and period controls
- chart annotations
- linked tables
- stronger tooltip design
- reusable chart state

This stage makes simulations inspectable and practical.

### Stage 4. Comparison and Portfolio Depth

Focus:

- broader instrument catalog
- comparison modes
- notebook and portfolio integration
- scenario saving and reuse
- eventually user-specific tracking insights

### Stage 5. Automation and Production Operations

Focus:

- cron or background sync
- health dashboards
- alerting
- data quality monitors
- stable production deployment discipline

## Long-Term Data Model Direction

The product should gradually move toward these stable data domains:

- `instrument_master`
  - identity, category, currency, display metadata, risk metadata
- `series_master`
  - series purpose, source, cadence, freshness policy, chart defaults
- `series_points`
  - raw or normalized points, quality flags, optional OHLC support
- `bond_offer_snapshots`
  - current and historical offer parameters
- `bond_issue_series`
  - issue-specific lifecycle data
- `sync_runs`
  - provider run status, coverage, counts, error summaries
- `simulation_artifacts`
  - optional future caching of expensive scenario outputs

The exact table names can differ, but the system should converge toward these concerns.

## Long-Term Calculation UX Direction

For every serious simulation, the product should eventually answer:

- what is the final value
- what is the real value
- what was earned as interest
- how much tax was paid
- how much fee was charged
- when major changes happened
- what would change under reinvestment or early exit

That means every mature calculator should eventually have:

- summary cards
- detailed chart
- detailed table
- explanation panel
- scenario assumptions block

## Long-Term Comparison UX Direction

Comparison should support:

- same start date, different horizon
- same horizon, different instrument
- reinvestment versus no reinvestment
- nominal versus real comparison
- one-to-many and many-to-many views where useful

The UI should clearly separate:

- normalized comparison
- independent scenario comparison
- benchmark comparison

## Long-Term Quality Standard

The product should aim for these standards:

- broad edge-case and realistic-case calculation coverage
- reproducible DB seeds
- synchronized public data with visible freshness
- charts and tables generated from the same simulation output
- no hidden fallback that changes financial meaning silently
- clear operator visibility into data coverage and sync failures

## Long-Term Delivery Rule

When choosing future work, prefer tasks that improve at least one of these foundations:

1. calculation trust
2. DB-backed data quality
3. chart and table clarity
4. comparison strength
5. UI consistency
6. operational reliability

If a new feature does not strengthen one of those, it should be deprioritized until the foundation is stronger.
