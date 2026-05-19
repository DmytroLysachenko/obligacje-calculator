# 20. Database & Data Modeling

This document describes the **actual current database model** used by the recovery-first version of the app.

The database is not a speculative future sketch anymore.
It already carries the trusted runtime state for:

- macro series metadata
- macro data points
- bond-type metadata
- monthly issued bond series
- notebook portfolios and lots
- public portfolio links
- shared single-scenario snapshots

The main design rule is:

- **do not model each bond family in a separate table**

Instead:

- `polish_bonds` stores bond-family rules
- `bond_series` stores issued-series overrides and month-specific offer terms
- calculator adapters resolve the right combination for a scenario

## 1. Current Runtime Source of Truth

The app currently uses PostgreSQL as the primary persisted source of truth for:

- `data_series`
- `data_points`
- `polish_bonds`
- `bond_series`
- `tax_rules`
- `user_portfolios`
- `user_investment_lots`
- `user_transactions`
- `shared_single_scenarios`

There are still bootstrap constants in the codebase.
Those constants are retained as:

- startup fallback definitions
- test fixtures
- recovery-mode fallback paths when DB coverage is missing

They are **not** the preferred final runtime truth for current offer terms.

## 2. Current Main Tables

### 2.1 `data_series`

Stores metadata for any time series used by retained routes.

Examples:

- `pl-cpi`
- `nbp-ref-rate`
- `sp500`
- `gold`

Important columns:

- `slug`
- `name`
- `category`
- `unit`
- `frequency`
- `display_precision`
- `display_step_default`
- `freshness_policy`
- `last_sync_status`
- `last_sync_error`
- `data_source`
- `last_data_point_date`
- `updated_at`

Why it matters:

- calculator context panels read freshness from here
- economic/reference pages read source/coverage status from here
- fallback vs synced behavior should always be visible through this metadata

### 2.2 `data_points`

Stores the actual time-series observations.

Important columns:

- `series_id`
- `date`
- `value`
- OHLC-style optional columns for market data when needed
- `quality_flag`
- `source_metadata`
- `created_at`

Current usage examples:

- monthly CPI values from official GUS archive
- NBP reference-rate history
- fallback-supported historical series used by reference pages

Important rule:

- one `(series_id, date)` pair must be unique
- display layers should derive chart and table data from these rows, not hardcode parallel histories in UI code

### 2.3 `polish_bonds`

Stores bond-family metadata.

Examples:

- `OTS`
- `ROR`
- `DOR`
- `TOS`
- `COI`
- `EDO`
- family bonds

Important columns:

- `symbol`
- `full_name`
- `full_name_en`
- `description`
- `description_en`
- `duration_days`
- `nominal_value`
- `capitalization_freq_days`
- `payout_freq_days`
- `interest_type`
- `first_year_rate`
- `base_margin`
- `withdrawal_fee`
- `withdrawal_fee_cap`
- `rollover_discount`
- `is_family_only`
- `updated_at`

What belongs here:

- stable family-level rules
- generic family defaults used only when no active issued-series override is available
- descriptive family metadata that survives across monthly issues

What does **not** belong here:

- every monthly issuance as duplicated family rows

### 2.4 `bond_series`

Stores issued monthly series such as:

- `ROR0527`
- `COI0530`
- `EDO0536`

Important columns:

- `bond_type_id`
- `series_code`
- `emission_month`
- `sell_start_date`
- `sell_end_date`
- `maturity_date`
- `first_year_rate`
- `base_margin`
- `created_at`

This table exists to solve a very specific product-trust problem:

- the **offer first-period rate** is not always the same thing as the **NBP reference rate**

Example:

- an ROR issue can begin at the official monthly offer rate
- only later monthly periods move to `NBP reference rate + margin`

That distinction must stay explicit in both the engine and the UI.

### 2.5 `tax_rules`

Stores annual tax and wrapper limits.

Important columns:

- `year`
- `ike_limit`
- `ikze_limit`
- `standard_tax_rate`
- `ikze_payout_tax_rate`

Purpose:

- keep tax-wrapper behavior data-driven
- reduce magic constants in calculator flows

### 2.6 `user_portfolios`

Stores notebook portfolio containers.

Important columns:

- `user_id`
- `name`
- `description`
- `share_id`
- `is_public`
- `created_at`
- `updated_at`

Current reality:

- notebook persistence works in guest mode by default
- ownership is tied to a guest owner cookie unless authenticated ownership exists
- public share links use `share_id`

### 2.7 `user_investment_lots`

Stores user-entered notebook lots.

Important columns:

- `portfolio_id`
- `bond_type`
- `bond_type_id`
- `bond_series_id`
- `purchase_date`
- `amount`
- `is_rebought`
- `notes`
- `created_at`

Purpose:

- bridge the gap between “simulation” and “tracking”
- keep notebook as a manual records workspace, not a bank integration

### 2.8 `user_transactions`

Stores transaction-level events for notebook lots.

Examples:

- buy
- sell
- interest payout
- tax withheld

This table is still narrower than a full brokerage ledger.
That is intentional.

### 2.9 `shared_single_scenarios`

Stores committed single-calculator share snapshots.

Important columns:

- `share_id`
- `title`
- `description`
- `scenario_kind`
- `payload_json`
- `calculation_version`
- `created_at`
- `updated_at`

Why this exists:

- query-param sharing was too fragile
- single-calculator sharing now uses **saved short links**
- a shared link must replay one committed scenario snapshot, not a half-dirty draft

## 3. Current Ownership Model

### 3.1 Guest-first notebook ownership

The retained notebook path is currently guest-first.

This means:

- a guest owner id is stored in a cookie
- portfolios and lots are scoped to that owner id
- the app creates a detached guest user record when needed

This is intentionally simpler than forcing account creation before the notebook becomes usable.

### 3.2 Public sharing

There are now two separate sharing patterns:

- **portfolio share**
  - based on `user_portfolios.share_id`
  - controlled by `is_public`
- **single-scenario share**
  - based on `shared_single_scenarios.share_id`
  - always a stored committed snapshot

These concerns stay separate on purpose.

Single-calculator sharing is not the same thing as notebook/portfolio sharing.

## 4. Current Bond Modeling Rules

### Rule 1. Family rules stay in `polish_bonds`

Use `polish_bonds` for:

- duration
- payout/capitalization cadence
- family-only scope
- default fee model
- default margin
- interest-type classification

### Rule 2. Monthly issuance lives in `bond_series`

Use `bond_series` for:

- issue code
- sell window
- maturity date
- first-period rate
- month-specific margin

### Rule 3. Calculators should resolve both together

The runtime resolver should:

1. pick the bond family
2. resolve the chosen or applicable issued series
3. use first-period series terms where they exist
4. use later floating/inflation rules according to family mechanics

Current retained runtime behavior now goes one step further:

- the app-wide "current bond definitions" map also inherits the latest active `bond_series` first-period terms where coverage exists
- this lets selectors and default retained calculator inputs reflect the current offer more truthfully without pretending the whole family row changes every month
- `polish_bonds` still owns family mechanics, while `bond_series` owns the active issued offer for first-period terms

### Rule 4. No separate tables per bond type

This is still a rejected direction.

Why:

- duplicated schema
- duplicated sync logic
- duplicated resolver paths
- higher long-term maintenance cost

## 5. Current Macro Data Rules

### 5.1 CPI

Current retained-source rule:

- `pl-cpi` uses the official monthly GUS archive as the active truth path

The app should not silently mix:

- GUS monthly CPI
- World Bank annual CPI
- old fallback placeholder semantics

for the same retained route without explicit labeling.

### 5.2 NBP reference rate

Current retained-source rule:

- the live integration still prefers official NBP data where available
- historical support is extended with a curated policy-rate history used as reference coverage when direct API history is incomplete

This must remain explicit in metadata.

The app must not imply:

- “current offer rate”

and

- “NBP reference rate”

are interchangeable.

They are not.

## 6. Current Compatibility Layer

The project currently uses a schema-compat layer in:

- `lib/db-schema-compat.ts`

This exists because some deployed or local databases predate later schema additions.

It currently patches runtime compatibility for:

- portfolio sharing columns
- shared single-scenario table creation

This is pragmatic recovery behavior, not ideal long-term migration architecture.

Long-term preference remains:

- explicit migrations
- less runtime patching

## 7. Indexing and Query Shape

Current key rules:

- time series need `(series_id, date)` uniqueness
- issued series need unique `series_code`
- share links need unique `share_id`
- lot ownership must remain resolvable via joins to `user_portfolios`

Current high-value query families:

- latest series metadata by slug
- data-point ranges by `series_id`
- current bond definitions map
- notebook lots by portfolio
- portfolio detail and simulation payload assembly
- shared scenario lookup by `share_id`

## 8. What the Client Stores Locally

Local browser storage is still used for some convenience features, but it is no longer the preferred truth for everything.

Current client-side persistence examples:

- locally saved single-scenario presets
- lightweight UX memory
- some route continuity hints

Important distinction:

- **local saved scenarios** are convenience storage
- **shared single scenarios** are server-backed committed snapshots

## 9. Current Caveats

The model is materially better than the earlier app state, but not perfect.

Remaining important caveats:

- some historical bond-series coverage is still not complete enough for every issued month ever sold
- NBP historical coverage is stronger than before but still partly supported by curated history rather than one ideal official archive endpoint
- runtime schema compatibility is still doing some migration-like work
- some calculators still consume family definitions more broadly than ideal issued-series resolution in edge cases
- NBP history is broader and more truthful than before, but retained reference coverage still includes curated support data rather than one perfect official historical feed

## 9.1 Current retained display-model rule

For payout-style bonds such as `ROR` and `DOR`:

- the primary retained display path is now based on total investor wealth
- timeline rows explicitly separate:
  - bond principal still on the instrument
  - cash already paid out
  - total scenario wealth
  - modeled early-exit value

This is an intentional product-trust rule.
The UI should not imply that the remaining principal on the bond is the investor's whole position once monthly payouts have already been distributed.

## 9.2 Floating-rate and display-pipeline rules

Keep these rules explicit across engine, display adapters, exports, and helper copy:

- `ROR` and `DOR` use the active issued series as the source of truth for the first monthly offer rate
- later floating periods use the retained NBP reference path plus bond margin
- `ROR` later periods use `NBP + 0.00%`
- `DOR` later periods use `NBP + 0.15%`
- chart granularity is a display-only concern and must never change calculation rhythm, tax timing, fee timing, or nominal/real value paths
- comparison export should remain comparison-oriented, with one aligned calendar output rather than two unrelated row-index dumps

## 10. Current Design Decisions to Preserve

Keep these decisions unless there is a strong reason to reverse them:

1. `polish_bonds` + `bond_series` remain the canonical bond model.
2. Do not add one table per bond family.
3. Notebook remains a manual portfolio workspace, not a broker integration.
4. Shared single-scenario links stay server-backed and committed.
5. Data freshness/source truth must be attached to the series metadata model, not scattered across page components.
6. Retained helper copy should come from locale files, not page-local language branches, wherever the retained core was already touched for trust fixes.
