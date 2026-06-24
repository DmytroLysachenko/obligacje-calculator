# 07. Product Quality Verification Tranche

This note records the quality tranche that followed the broad visual cleanup.

The goal is not feature expansion.
The goal is a more trustworthy retained product:

- calculation scenarios have stronger regression coverage
- comparison reads like a calculator, not a recommendation board
- economic data behaves like a dashboard with clear source status
- workspace state has one active portfolio concept
- translation parity and docs remain enforceable

## 1. Calculation Truth

The calculator QA pass added deterministic scenarios for:

- EDO 10-year full-cycle capitalization
- ROR 20-year rollover
- DOR 4-year floating-rate path
- rebuy discount under long rollover
- early EDO exit
- yearly CPI path sensitivity
- flat NBP path behavior
- regular DOR plan consistency
- ladder-style EDO maturity spacing
- comparison output matching an equivalent single scenario
- retirement steady-rate sustainability
- multi-asset fallback-history calculations

These tests live with bond-core because they guard engine behavior, not UI.

Expected maintenance rule:

- prefer scenario builders over copy-pasted payloads
- keep macro data deterministic
- use exact assertions where the engine contract is exact
- use bounded assertions where the contract is behavioral

## 2. Comparison Flow

The comparison page now follows this reading order:

1. configure one shared scenario
2. read one leading modeled result
3. inspect the chart path
4. open bond-by-bond details only when needed
5. open calculation context last

This is intentional.

The page should not default to dense result cards before the user sees the primary outcome.
The page should also avoid winner or recommendation framing.

Allowed language:

- leading modeled result
- highest modeled payout
- current scenario outcome
- comparison result

Avoid:

- winner
- best choice
- smart pick
- recommended bond

## 3. Economic Data Dashboard

The economic-data page now separates:

- charts
- source status
- usage guide

This keeps the page information-rich without making the first viewport a pile of panels.

The page remains a reference surface.
It should not become a forecasting workflow.

Source/status panels should answer:

- where the data came from
- which range is covered
- whether fallback data is active
- whether the series is current enough to support calculator reading

## 4. Workspace Product Model

Workspace state now has a clearer active-portfolio concept.

The active portfolio is:

- the selected workspace destination
- persisted through the shared workspace selection helper
- used by save-to-notebook behavior
- visible in the notebook status panel

Opening a portfolio details page is a separate action from choosing the active portfolio.
This distinction prevents the notebook route from jumping into detail view merely because a saved active portfolio exists.

Guest mode remains locked for mutations.
Guests can still calculate and inspect preview surfaces.

## 5. i18n Quality

Locale parity now checks that Polish contains every English translation key.

This does not require English and Polish to have identical plural morphology.
Polish may keep extra plural forms where needed.

When adding UI copy:

- add English and Polish keys in the same change
- avoid internal-looking labels
- do not add user-facing English fallback text in components
- keep recommendation-like language out of retained calculator flows

## 6. Shared Component Direction

Prefer existing shared display primitives before adding new wrappers:

- `MetricStrip`
- `ScenarioFactsBlock`
- `CalculationMetaPanel`
- `ResultSummaryHero`
- `SecondaryInsightAccordion`
- reference note/rail components

Add a new shared component only when it removes repeated structure in at least two places.

Avoid over-generalized components that hide domain meaning.

## 7. Verification Commands

Use these checks for this tranche:

```bash
pnpm test:core
pnpm vitest run i18n/locale-parity.test.ts shared/lib/data-reference.test.ts shared/lib/workspace/portfolio-selection.test.ts
pnpm exec tsc --noEmit
```

Before release-candidate review, run:

```bash
pnpm test:ci
pnpm lint
pnpm build
```

## 8. Exit Criteria

This tranche is complete when:

- all five commits are landed
- each commit changes at least 150 lines
- calculator truth coverage includes the named scenario set
- comparison no longer centers winner language
- economic-data source status is one deliberate dashboard area
- active portfolio selection and detail navigation are separate
- locale parity catches missing Polish keys
- docs describe current architecture and workflow

## 9. Open Follow-Ups

Potential next improvements:

- add Playwright route screenshots for comparison, economic data, and notebook
- profile chart-heavy pages before adding memoization
- add route-level smoke tests once the app has stable test auth fixtures
- expand parity checks to flag unused keys after the next copy sweep
