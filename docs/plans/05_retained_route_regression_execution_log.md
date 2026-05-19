# 05. Retained Route Regression Execution Log

This log records the current retained-route validation status after the latest trust-first implementation passes.

It is intentionally narrower and more honest than a release-style "all green" note.

This document exists to answer:

- what was materially improved
- what was actually checked
- what remains a known limitation
- what should still block production-candidate signoff

Read it together with:

- [03. Manual Regression and Release Candidate Checklist](./03_manual_regression_and_release_candidate_checklist.md)
- [04. Post-Refactor Polish and Hardening Plan](./04_post_refactor_polish_and_hardening_plan.md)

## 1. Scope of This Log

This pass combines:

- committed implementation work
- targeted engine and display-model tests
- retained-route review against previously known trust and UX gaps

This is **not yet** a final full manual signoff pass across every route and every bond family.

## 2. High-Level Status

### 2.1 Confirmed Improvements

- current runtime bond defaults now inherit active issued-series terms from `bond_series`
- single-scenario sharing now uses persisted server-backed snapshots
- notebook deletion now works end to end
- notebook state is more stable after create, import, share toggle, and delete
- payout-bond display semantics are materially better for `ROR` and `DOR`
- single-calculator CSV export now follows the same normalized display model more closely
- comparison export now ships as one comparison-grade aligned calendar CSV instead of two disconnected scenario dumps
- CPI retained sync now uses the official GUS monthly archive path
- retained calculator surfaces share more reusable primitives and calmer layout patterns
- retained helper copy for compare/single surfaces is more locale-driven and less dependent on page-local language branching

### 2.2 Remaining Known Limits

- NBP history is broader than before but still partly curated where direct historical coverage is not available through one clean public feed
- retained calculators still need broader scenario-by-scenario trust validation
- notebook, comparison, and export flows still need wider end-to-end regression coverage
- final manual retained route sweep is still needed for spacing, wide-table desktop fit, and mobile behavior
- retained visual polish is materially improved, but not yet at a final "ship it without review" finish level

## 3. Retained Route Snapshot

### 3.1 Home `/`

Status:

- `partially validated`

Confirmed:

- route behaves like a calm routing hub, not the earlier dashboard shell
- single calculator remains the main path
- recovery-lab surfaces remain secondary

Remaining risk:

- desktop/mobile polish still deserves one final pass before release-candidate review

Decision:

- `keep as current class`

### 3.2 Education `/education`

Status:

- `acceptable with short recheck still useful`

Confirmed:

- route remained visually stable through retained-shell simplification
- current surface is already acceptable relative to the noisier retained routes

Remaining risk:

- short PL copy/focus-state recheck still worth doing during the final route pass

Decision:

- `keep as current class`

### 3.3 Single Calculator `/single-calculator`

Status:

- `improved but still requires deeper trust validation`

Confirmed:

- broken "vs previous run" noise is gone
- sharing now uses stored scenario snapshots instead of misleading query-param copying
- payout-bond chart/schedule semantics are more coherent
- quick audit no longer anchors on the raw purchase row
- exported CSV follows normalized display rows more closely
- helper reading bands, rate-context notes, and scenario-facts presentation now use narrower shared primitives

Remaining risk:

- still needs broader real-scenario checks across `OTS`, `ROR`, `DOR`, `TOS`, `COI`, `EDO`, early-exit, reinvest, and swap combinations
- desktop schedule fit is tighter than before but still deserves final wide-screen review

Decision:

- `keep as current class`

### 3.4 Comparison `/compare`

Status:

- `materially improved, still conditional`

Confirmed:

- fixed calculate/recalculate widget now matches the retained calculator pattern
- advanced inflation controls were reconnected to calculation state
- route reads more like explicit scenario comparison and less like a recommendation engine

Remaining risk:

- still needs edge-case validation around mixed payout cadence and uneven bond horizons
- export and chart interpretation need broader manual scenario-pair review

Decision:

- `keep as conditional`

### 3.5 Regular Investment `/regular-investment`

Status:

- `acceptable with final polish pending`

Confirmed:

- shares the retained calculator shell and summary structure more coherently
- export path uses the normalized CSV helper

Remaining risk:

- still needs a final scenario and layout pass comparable to single-calculator

Decision:

- `keep as conditional`

### 3.6 Ladder `/ladder`

Status:

- `acceptable with final polish pending`

Confirmed:

- shares more retained calculator surface patterns than before
- helper content is properly secondary

Remaining risk:

- still needs a final scenario sanity and schedule-fit review

Decision:

- `keep as conditional`

### 3.7 Notebook `/notebook`

Status:

- `materially improved, still needs one full lifecycle pass`

Confirmed:

- create/import/delete selection flow is more stable
- detail-view share toggling now syncs notebook state more coherently
- export now behaves more explicitly as JSON package/summary download
- destructive delete action exists from both detail and list surfaces

Remaining risk:

- full lifecycle still needs one explicit manual pass:
  - create
  - import
  - open
  - share toggle
  - export
  - delete
  - reload continuity under guest ownership

Decision:

- `keep as conditional`

### 3.8 Economic Data `/economic-data`

Status:

- `trust framing improved, data-depth caveat remains`

Confirmed:

- CPI path now uses the official GUS monthly archive
- reference language more clearly distinguishes supportive context from mature forecasting
- NBP coverage is labeled more honestly than earlier

Remaining risk:

- NBP historical coverage is still partly curated where direct public historical access is limited
- route must not overclaim "complete live macro terminal" quality

Decision:

- `keep as reference/trusted support surface`

## 4. Shared Flow Evidence

### 4.1 Sharing

Confirmed:

- single-calculator sharing now stores replayable committed scenario snapshots
- notebook public/private toggling updates current state more reliably

Remaining risk:

- shared scenario replay still deserves a clean-session manual check

### 4.2 Exports

Confirmed:

- single-calculator CSV export follows normalized schedule display columns
- notebook export now uses explicit JSON download handling
- PDF remains separated from the earlier broken screenshot/export path

Remaining risk:

- comparison and recurring-plan exports still need broader real-payload regression checks

### 4.3 Data Truth

Confirmed:

- CPI no longer has conflicting active writers in retained flows
- current bond-family defaults are no longer limited to family-level fallback values when active issued-series data exists

Remaining risk:

- NBP history trust is improved, not perfect
- retained calculators still require more scenario-based verification before final trust claims

## 5. Recommended Next Validation Pass

The next practical pass should be:

1. manual retained-route sweep
2. real-scenario checks for `ROR`, `DOR`, `COI`, `EDO`, and early-exit paths
3. notebook lifecycle reload/share/delete continuity checks
4. comparison chart/export edge-case checks
5. desktop + mobile schedule/table review

## 6. Current Release Position

Current position:

- the app is materially more coherent and more trustworthy
- the retained architecture and display-model decisions are now documented
- the app is **not yet** at final production-candidate signoff

The remaining work is mostly:

- evidence
- edge-case validation
- route-by-route trust confirmation

not another major architecture rewrite.
