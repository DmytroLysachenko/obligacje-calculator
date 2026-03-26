# 27. Calculation Reliability Remediation Plan

This document defines the required actions for fixing the app's calculation reliability problems.

The goal is simple:

- make bond calculations trustworthy
- make comparison scenarios explainable
- remove silent data inconsistencies
- ensure long-horizon simulations behave as users expect

## Current Progress

Implemented so far:

- separation of bond cycle versus investment horizon for long-horizon rollover simulations
- rate-resolution audit metadata on timeline points
- explicit normalized versus independent compare modes in the UI
- DB-backed multi-asset history with explicit fallback/source metadata
- first-year rate handling fixed for monthly-payout variable-rate bonds
- fee/tax settlement corrected so payout bonds do not get re-taxed at exit and maturity points do not show early-redemption fees
- initial golden fixtures for rollover and early-exit scenarios

Still to expand:

- more fixture coverage for IKZE, deflation, and missing macro-history cases
- stronger explanation UI for per-period tax and rebuy-discount decisions
- fuller freshness and stale-data messaging on all macro-data screens

## 1. Core Problems

The current issues fall into a few categories.

### 1.1 Bond Duration vs Investment Horizon

The app still risks mixing:

- **bond duration**: native product term, for example `1y ROR` or `10y EDO`
- **investment horizon**: how long the user wants to keep money invested overall

This causes incorrect or misleading behavior for scenarios like:

- `ROR for 5 years`
- `ROR for 7 years`
- `COI for 12 years`
- `EDO for 7 years with early exit`

The engine must simulate repeated bond cycles across the user-selected horizon, not just one native bond period.

### 1.2 Compare Flow Is Under-Specified

The app needs two different comparison modes:

- **Normalized compare**: same purchase date, same withdrawal date, same initial capital
- **Independent compare**: scenario A and scenario B each have their own horizon, rollover, tax mode, and assumptions

Without this split, comparisons become confusing or technically misleading.

### 1.3 Macro Data Trust Is Too Weak

Calculation results depend heavily on:

- CPI / inflation history
- NBP reference rate history
- current bond offer parameters
- projected fallback assumptions

If these are inconsistent, stale, or silently substituted, the resulting numbers are hard to trust.

### 1.4 Results Are Not Explainable Enough

Users need to understand:

- which rate was used in each period
- whether the rate came from history or projection
- when rollover occurred
- when tax was charged
- when an early redemption fee was charged
- whether rebuy discount was applied

Right now, too much of that logic is hidden.

### 1.5 Regression Safety Is Not Strong Enough

The engine needs approved fixtures for known scenarios so that future refactors cannot quietly break financial logic.

## 2. Required Actions

### 2.1 Define Canonical Calculation Scenarios

Create and enforce these as the only valid calculation entry points:

- `SingleBondScenario`
- `SingleBondRolloverScenario`
- `BondComparisonNormalizedScenario`
- `BondComparisonIndependentScenario`
- `RegularInvestmentScenario`

Each scenario must explicitly declare:

- bond type
- purchase date
- target withdrawal date
- rollover enabled or disabled
- early exit allowed or disabled
- tax mode
- inflation mode: historical, projected, custom
- NBP mode: historical, projected, custom

### 2.2 Separate Bond Cycle from Investment Horizon

The engine must treat these separately.

- **Bond cycle** = the product's native maturity period
- **Investment horizon** = the user-selected end date

The engine should:

- run one or more bond cycles until target withdrawal date
- apply rollover only when enabled
- preserve leftover cash explicitly
- apply rebuy discount only where eligible
- support partial final cycles when withdrawal is before next maturity

Primary code areas:

- [calculations.ts](C:/Users/Asus/Desktop/projects/pet-projects/obligacje-calculator/features/bond-core/utils/calculations.ts)
- [rollover.ts](C:/Users/Asus/Desktop/projects/pet-projects/obligacje-calculator/features/bond-core/utils/engine/rollover.ts)
- [timeline-builder.ts](C:/Users/Asus/Desktop/projects/pet-projects/obligacje-calculator/features/bond-core/utils/engine/timeline-builder.ts)

### 2.3 Build a Rate-Resolution Audit Trail

Each timeline point should expose:

- rate source
- reference CPI or NBP value
- applied margin
- final rate used
- historical vs projected flag

Recommended source tags:

- `first_year_fixed`
- `historical_cpi_lag`
- `projected_cpi`
- `historical_nbp`
- `projected_nbp`

This is required so suspicious outputs can be inspected rather than guessed at.

### 2.4 Rebuild Compare Around Two Explicit Modes

The compare feature should support both:

- normalized compare
- independent compare

Independent compare is required for cases like:

- `EDO for 7 years` vs `ROR for 5 years`
- `COI with rollover` vs `EDO without rollover`
- `ROR standard tax` vs `ROR IKE`

Relevant code areas:

- [ComparisonContainer.tsx](C:/Users/Asus/Desktop/projects/pet-projects/obligacje-calculator/features/comparison-engine/components/ComparisonContainer.tsx)
- [BondComparisonContainer.tsx](C:/Users/Asus/Desktop/projects/pet-projects/obligacje-calculator/features/comparison-engine/components/BondComparisonContainer.tsx)
- [useComparison.ts](C:/Users/Asus/Desktop/projects/pet-projects/obligacje-calculator/features/comparison-engine/hooks/useComparison.ts)

### 2.5 Tighten Tax and Fee Rules

Add explicit rules and tests for:

- monthly payout bonds vs capitalized bonds
- standard account vs IKE vs IKZE
- early withdrawal before interest exceeds fee
- fee capping
- legal rounding moments
- no double-counting between periodic tax and exit tax

### 2.6 Replace Silent Fallbacks with Visible Warnings

If macro data is missing:

- the result may still calculate
- but the envelope must say exactly what was projected
- the UI must show this clearly
- compare should surface data-quality differences between scenarios

### 2.7 Move Multi-Asset to DB-Backed Data

The current embedded historical dataset should become fallback only.

The production path should use DB-backed series for:

- S&P 500
- gold
- savings proxy
- CPI
- NBP

Requirements:

- support dates from at least `1990-01`
- guarantee drawdown data as part of the series contract
- expose freshness/source metadata

### 2.8 Add Golden Regression Fixtures

Add approved scenarios for:

- `ROR 1y no rollover`
- `ROR 5y with rollover`
- `EDO 10y to maturity`
- `EDO early withdrawal in year 7`
- `COI multi-cycle with rebuy discount`
- deflation case
- missing CPI history case
- IKZE exit case

Relevant test files:

- [regression.test.ts](C:/Users/Asus/Desktop/projects/pet-projects/obligacje-calculator/features/bond-core/utils/regression.test.ts)
- [calculations.comprehensive.test.ts](C:/Users/Asus/Desktop/projects/pet-projects/obligacje-calculator/features/bond-core/utils/calculations.comprehensive.test.ts)

## 3. Implementation Plan

### Phase 1. Scenario Model Hardening

- finalize canonical scenario contracts
- separate cycle vs horizon everywhere
- standardize rollover behavior
- add invariant validation for dates, tax mode, and rebuy eligibility

### Phase 2. Compare Rebuild

- implement normalized compare mode
- implement independent compare mode
- expose warnings and assumptions per scenario
- add rate-path explanation panels

### Phase 3. Data Trust Layer

- unify macro series slug handling
- make DB history the primary source
- keep fallback data explicit
- attach freshness metadata to envelopes

### Phase 4. Multi-Asset Reliability

- replace mock series with DB-backed series
- extend history range to 1990+
- validate drawdown output
- expose source coverage and data gaps

### Phase 5. UX and i18n Cleanup

Priority screens:

- `/single-calculator`
- `/compare`
- `/multi-asset`
- `/ladder`

Goals:

- remove hardcoded English in localized flows
- remove mojibake / encoding issues
- ensure warnings and assumptions are clearly understandable

## 4. Acceptance Criteria

Calculations should not be considered trustworthy enough until all of the following are true:

- a short-duration bond can be simulated across a longer horizon with rollover
- compare supports both same-horizon and independent scenarios
- each result can explain its rates, taxes, fees, and fallback assumptions
- historical vs projected data use is visible
- multi-asset uses DB-backed history by default
- regression fixtures cover major Polish bond edge cases
- suspicious outputs can be traced to explicit rules and data inputs

## 5. Recommended Immediate Sprint

The highest-value next sprint is:

1. finalize independent scenario compare
2. finish horizon-vs-cycle separation everywhere
3. add rate-resolution audit metadata to timeline points
4. add 8-12 golden regression fixtures
5. move multi-asset off mock history

## 6. Expected Outcome

If this plan is executed fully, the app will move from "interesting calculator with visible inconsistencies" to "reliable and inspectable financial modeling tool."

That is the standard the app should be aiming for.
