# 02. Full App Refactor and Recovery Plan

This is the active recovery plan for the application.

It replaces the previous feature-growth direction with a stricter recovery program focused on:

- calculation correctness
- stability
- performance
- simpler UX
- clearer product boundaries
- honest documentation

The app currently contains useful code and useful domain work, but it is overbuilt relative to its reliability level. The product needs narrowing, not expansion.

## 0. Current Progress Snapshot

The recovery plan is already partly implemented.

Completed or materially improved already:

- major calculator mount/update loops were reduced
- single calculator, comparison, regular-investment, ladder, notebook, and multi-asset flows were simplified substantially
- recommendation-style wording was reduced across ranking and comparison surfaces
- trusted/conditional/experimental status is visible in UI
- retirement support scope is narrower and more explicit
- family-only bond handling is more honest across calculators
- economic/reference pages now surface source, coverage, and freshness more directly
- flagship scenario golden tests exist for core calculator outputs
- comparison and ladder golden regressions now cover broader retained-core baselines
- support-matrix tests exist for broader scenario classes
- notebook portfolio deletion now works end to end
- single-calculator sharing now uses persisted short-link snapshots instead of implicit URL copying
- retained schedule tables now have a reusable mobile sheet pattern instead of raw wide-table dependency on small screens
- monthly-payout display semantics were corrected so payout-bond results emphasize total investor wealth instead of only bond principal
- NBP history support is materially broader than before and is labeled more honestly as synced vs curated reference coverage

Still not complete:

- post-refactor sanity debugging from real usage
- broader exploratory edge-case testing after manual review
- final release-gate review for production candidacy

## 1. Real Current State

As of April 30, 2026, the app should be treated as `pre-production` and `partially unstable`.

The main issues are not cosmetic only. They affect trust, usability, and product positioning.

### 1.1 Main Product Problems

- some calculators can enter excessive or repeated update/calculation cycles on open
- comparison-related flows still show infinite or near-infinite update behavior
- "choose bond" behaves too much like a recommendation feature instead of a neutral calculator
- some result language suggests an objective best choice or winning option
- UI density is too high and hides what matters
- some controls create random-looking layout changes or visual artifacts during interaction
- sliders across the app are difficult to use precisely
- small input edits trigger too much recalculation and too much UI work
- there is not enough debouncing or separation between draft input state and committed calculation state
- some pages have poor contrast and weak readability
- economic data pages look unfinished and untrustworthy
- sync status shown in UI is stale and misleading
- market-vs-bonds data coverage is too weak for the way the feature is presented
- retirement flow appears narrower than the UI implies
- documentation overstates app maturity, feature completion, and readiness

### 1.2 Product-Level Consequences

These issues create direct product damage:

- users cannot easily trust the numbers
- users cannot easily trust the interface
- users cannot tell what is stable versus experimental
- the app feels heavier and more complicated than its value justifies
- the product can drift into financial-advice perception risk
- development energy gets wasted on features that add surface area without improving trust

## 2. Problem Inventory From Current Review

This section turns the observed issues into concrete refactor targets.

### 2.1 Calculator Stability Problems

Observed or strongly suspected:

- single calculator had effect/callback dependency loops
- comparison page still shows repeated update behavior
- auto-calculate patterns are too common and too loosely controlled
- URL synchronization can participate in repeated state churn
- form state changes can cause chart/result recomputation too aggressively

Likely root causes:

- unstable callback dependencies
- effects tied to changing object identity
- optimistic auto-calc on mount plus auto-calc on input mutation
- broad state objects passed through multiple layers
- no clear boundary between editing inputs and committing scenario changes

Required response:

- audit every calculator mount path
- reduce or remove auto-calculate where it harms clarity/performance
- standardize calculation trigger policy
- isolate charts/tables from raw input keystrokes

### 2.2 "Choose Bond" Product Positioning Problems

Observed:

- result language implies recommendation
- labels such as "best choice" and "winner" cross the intended product boundary
- ranked outputs can be interpreted as financial advice
- the model can produce results that are mathematically inconsistent or misleading if assumptions/scenarios are weak

Required response:

- rename feature away from advice framing
- replace ranking copy with neutral simulation wording
- explicitly state assumptions behind ranking outputs
- treat it as scenario sorting, not investor recommendation
- if calculation quality is not good enough, downgrade or hide the feature until validated

### 2.3 UX Clutter and Strange Interaction Problems

Observed:

- too many panels, widgets, and actions around calculators
- random-seeming line/artifact appearing in the middle of the screen during interaction
- users lose track of what was edited, what recalculated, and what changed
- calculators try to do too many things at once

Required response:

- reduce visible surface area
- remove low-value side widgets from core calculator flows
- collapse advanced options
- make one primary input path and one primary result path
- inspect layout/render artifacts caused by conditional sections, stale loading states, or transition wrappers

### 2.4 Slider and Input Ergonomics Problems

Observed:

- sliders are difficult to control
- slider steps are too large for macro assumptions
- inflation changes in coarse increments feel wrong
- slider behavior is inconsistent across pages
- some controls feel unpredictable

Required response:

- every important slider gets paired with numeric input
- reduce step size on inflation/NBP-type controls
- cap inflation sliders at sensible max such as 15%
- remove sliders where direct numeric input is superior
- standardize slider behavior and style across the app

### 2.5 Performance Problems

Observed:

- every small input change can lead to large UI updates
- page performance degrades because calculations, charts, and state updates happen too eagerly
- there is not enough debouncing
- complex pages feel busy even when user intent is simple

Required response:

- debounce free text and slider changes
- commit calculations on button press where appropriate
- split draft state from calculated state
- avoid rerendering heavy result blocks on every keystroke
- keep charts/results subscribed to committed calculation output only

### 2.6 Data and Sync Credibility Problems

Observed:

- economic data page is effectively empty or weak
- source labels show `unknown`
- sync badge shows stale `Synchronizacja 2024-01`
- market-vs-bonds historical range appears too short for the promise of the feature
- some features feel powered by placeholder or fallback-like datasets

Required response:

- audit data source pipeline end to end
- fix freshness metadata propagation
- show real coverage and source details
- expand historical range where feasible
- if data is not strong enough, reduce or relabel the feature instead of pretending completeness

### 2.7 Retirement Planner Scope Problems

Observed:

- retirement plan seems limited to only a subset of bonds
- UI likely implies broader support than the engine actually provides
- this damages trust because user expectation and actual model scope diverge

Required response:

- define exactly which bonds/scenarios retirement supports
- explain why unsupported paths are excluded
- either broaden validated support or narrow the feature and relabel it

### 2.8 Documentation Credibility Problems

Observed:

- previous plans implied production maturity
- "done" language appeared for unstable or weak surfaces
- roadmap described expansion while foundation was not stable
- docs and app reality diverged

Required response:

- mark app as pre-production
- move all active docs to recovery-first framing
- define hard release gates
- ban completion language based only on feature existence

## 3. Recovery Goal

Refactor the app into a **simple, fast, understandable, trustworthy Polish treasury bond calculator product**.

The app should be optimized for:

- calm interaction
- transparent assumptions
- correct calculations
- limited but reliable scope
- readable output

The app should not optimize for:

- feature count
- novelty
- pseudo-advisory language
- platform breadth before calculator trust

## 4. Product Rules After Reset

### Rule 1. Calculator, not advisor

The product may:

- simulate scenarios
- compare scenarios
- sort scenario outputs by selected metrics

The product must not:

- imply a personal recommendation
- use "winner" or "best for you" framing
- behave like suitability tooling

Approved framing:

- "highest projected payout under these assumptions"
- "scenario comparison"
- "simulation result"
- "ranked by selected metric"

Disallowed framing:

- "best choice"
- "winner"
- "recommended for you"
- "you should buy"

### Rule 2. Explicit beats auto-magic

If live recalculation harms stability, clarity, or performance:

- prefer debounced updates
- prefer an explicit calculate button
- prefer staged commit of assumptions

### Rule 3. Fewer controls, better defaults

- keep default inputs simple
- collapse advanced controls
- avoid duplicated switches/sliders/secondary widgets
- optimize for clarity first, flexibility second

### Rule 4. Every page must earn navigation space

A page stays in primary navigation only if it is:

- understandable
- useful
- stable
- backed by real data if it claims data depth

Otherwise:

- downgrade it
- hide it
- relabel it experimental
- or remove it

## 5. Page-by-Page Triage

### 5.1 Single Calculator

Current value:

- core product surface

Current problems:

- too much surrounding UX complexity
- unnecessary widgets and actions around core flow
- possible random layout artifacts
- too much update activity for small edits

Refactor direction:

- keep as flagship surface
- simplify into primary inputs, calculate action, summary, details
- move advanced controls into secondary sections
- keep explanations, but not in a way that crowds the main task

### 5.2 Comparison

Current value:

- valuable if mathematically trustworthy and calm to use

Current problems:

- repeated update behavior
- too much UI complexity
- recommendation-adjacent language in related compare/rank flows

Refactor direction:

- keep only neutral scenario comparison
- remove advice framing
- simplify to one explicit comparison model at a time
- separate normalized compare from advanced compare if both remain

### 5.3 Choose Bond / Smart Bond Finder

Current value:

- useful only if reframed as scenario ranking under assumptions

Current problems:

- recommendation risk
- weak trust when underlying calculations/ranking logic are not fully validated
- copy overshoots product boundary

Refactor direction:

- rename or downgrade
- neutralize output language
- keep only if ranking logic is verified and assumptions are explicit

### 5.4 Regular Investment and Ladder

Current value:

- useful extensions if they remain aligned with bond mechanics and tested

Current problems:

- likely shares too much of unstable auto-calc behavior
- may be too state-heavy for current UI architecture

Refactor direction:

- keep only if stable and understandable
- standardize interaction model with single calculator
- use committed calculation state, not uncontrolled live churn

### 5.5 Retirement Planner

Current value:

- potentially useful but high-risk for misunderstanding

Current problems:

- support scope appears partial
- user expectation may exceed model reality

Refactor direction:

- narrow sharply
- clearly define supported bonds/scenarios
- remove any implication of retirement advice

### 5.6 Market vs Bonds

Current value:

- interesting educational comparison only if data is real and sufficient

Current problems:

- data range appears too limited
- may rely on fallback-like or weak historical coverage
- current product promise likely exceeds actual data depth

Refactor direction:

- either upgrade data substantially or reduce feature ambition
- clearly show source and coverage
- do not present as a mature market backtesting product unless it really is one

### 5.7 Economic Data

Current value:

- supportive reference section

Current problems:

- empty/weak state
- unknown source labels
- low trust presentation

Refactor direction:

- fix data provenance and freshness display
- if data is not ready, hide or relabel until it is usable

## 6. Workstreams

### Workstream A. Stabilize Render and Calculation Flow

Goals:

- remove infinite loops and redundant effects
- stop cascading page-wide updates from tiny input changes
- isolate expensive charts/results from raw form edits

Concrete tasks:

- audit every `useEffect` that triggers calculation on mount or on debounced state
- audit URL sync hooks and search-param interactions
- remove unstable callback dependencies from calculation triggers
- introduce a shared rule for initial calculation behavior
- separate draft form state from committed calculation payloads on heavy pages
- ensure charts subscribe to committed results, not raw input typing

Acceptance criteria:

- opening a calculator triggers at most one intended initial calculation
- typing in an input does not create render storms
- changing one control does not remount unrelated sections
- comparison page no longer loops on open

### Workstream B. Simplify Calculator UX

Goals:

- make each calculator understandable in under one minute
- reduce noise and visual interruptions
- remove unexplained visual artifacts

Concrete tasks:

- redesign each calculator into:
  - inputs
  - calculate action
  - summary
  - optional details
- remove low-value side widgets from primary flows
- review all conditional separators, panels, skeletons, and transition effects
- reduce action button count in result headers
- make advanced settings clearly secondary

Acceptance criteria:

- primary calculator page has one obvious input flow
- no unexplained line/box appears during interaction
- users can tell what changed and why

### Workstream C. Fix Controls and Input Ergonomics

Goals:

- sliders become optional helpers, not the main input burden
- numeric precision becomes controllable

Concrete tasks:

- standardize slider component configuration
- pair every financial slider with direct numeric entry
- reduce inflation and NBP step sizes
- cap inflation slider max around 15% unless scenario requires more
- review all places where step size is too coarse or interaction is jumpy
- replace poor-fit sliders with number inputs where needed

Acceptance criteria:

- users can enter exact values without fighting the control
- slider motion is predictable on desktop and mobile
- assumption inputs do not jump by overly large increments

### Workstream D. Revalidate Calculator Scope and Math

Goals:

- confirm which calculators are trustworthy enough to keep live
- fix or narrow "choose bond", comparison, ladder, and retirement logic

Concrete tasks:

- define supported scenario matrix per calculator
- build bond-type-by-bond-type verification checklist
- review timing, rollover, tax, inflation lag, and payout handling
- confirm retirement planner support boundaries
- review choose-bond ranking assumptions and remove unsupported logic
- disable or mark experimental any path that fails review

Acceptance criteria:

- each live calculator has explicit supported scenarios
- unsupported or weak paths are disabled or labeled
- choose-bond no longer reads like advice
- retirement scope matches real engine support

### Workstream E. Data Source and Sync Reliability

Goals:

- fix stale sync indicators
- stop showing empty/unknown data surfaces as mature pages

Concrete tasks:

- audit sync metadata storage and presentation
- fix stale `Synchronizacja 2024-01` display
- define source, freshness, and coverage model for each data page
- review economic-data API/data-loading path
- review market-vs-bonds historical dataset completeness
- reduce scope where real data quality cannot support feature claims

Acceptance criteria:

- each data module exposes source, coverage, and last sync timestamp
- no major page shows `unknown` source in normal operation
- stale sync state is visible and actionable
- economic data page is either useful or intentionally hidden
- weaker historical comparison pages are demoted if data breadth still does not justify stronger promotion

### Workstream F. Contrast, Accessibility, and Readability

Goals:

- improve legibility and reduce visual fatigue

Concrete tasks:

- audit low-contrast text pairs
- revise muted-text usage in important surfaces
- standardize result-card hierarchy
- ensure warning and data-source labels remain readable
- reduce decorative visual noise that competes with content

Acceptance criteria:

- critical labels, warnings, and numbers pass basic contrast checks
- result surfaces remain readable without visual hunting

### Workstream G. Documentation Reset

Goals:

- docs become truthful operating documents again

Concrete tasks:

- replace fake completion framing with recovery framing
- define hard release gates
- align product requirements with actual product boundaries
- document trusted vs experimental feature classes
- stop using "done" language for unstable surfaces

Acceptance criteria:

- no active doc claims production maturity without evidence
- current plans match current engineering priorities

## 7. Delivery Sequence

### Phase 1. Emergency Stabilization

- fix loops
- reduce recalculation churn
- patch sync/status regressions
- stop the worst UI artifacts

### Phase 2. Core Calculator Simplification

- simplify single calculator
- simplify comparison
- standardize controls
- remove recommendation language

### Phase 3. Math and Scope Validation

- verify each supported calculator
- disable or downgrade weak features
- align copy with actual capability

### Phase 4. Data and Economic Pages

- repair source/freshness
- upgrade or reduce historical pages
- fix economic data visibility

### Phase 5. Production Candidate Narrowing

- decide retained feature set
- complete final polish on retained set only

## 7.1 Current Implemented Recovery Moves

This subsection records the main completed recovery moves so the plan remains truthful.

As of May 8, 2026, the application has moved materially further through this plan than the earlier snapshot reflected.

### Interaction and State

- explicit calculate/recalculate flow is used much more broadly now
- several calculator surfaces no longer auto-churn on every small input mutation
- draft-vs-committed calculation flow is more consistent on heavier pages
- state noise and decorative UI layers were reduced across major calculators
- stale shell-cache behavior was patched so old and new UI shells stop fighting each other in normal usage

### Product Boundary

- ranking and comparison wording is more neutral
- optimizer is treated as scenario sorting, not investor guidance
- multi-asset is treated as a historical reference surface, not a mature backtesting product
- retirement is treated as a limited withdrawal model, not retirement advice
- recovery-lab pages now look and read more clearly like narrower supporting tools instead of equal flagship routes

### Support Matrix Enforcement

- shared bond support metadata now exists in code
- family-only bonds are labeled in selectors
- retirement only exposes the narrower supported bond list
- weaker pages are grouped into a recovery-lab style navigation area
- trusted/conditional/experimental framing is now more consistent in shared navigation and page-level notices

### Test Coverage

- support-matrix regression tests protect scenario-class expectations
- flagship golden tests protect exact outputs for representative single-bond, regular-investment, comparison, and retirement cases
- retained-route cleanup work was repeatedly checked with `eslint`, `tsc`, and core engine tests on each major commit batch

### Data Honesty

- reference pages now present source/coverage/as-of metadata more consistently
- fallback states are described more directly instead of silently reading like mature production feeds
- sidebar and shared trust framing now reflect freshness/fallback state more calmly and more explicitly

### UX Simplification

- home page was reduced into a calmer recovery-first hub
- single calculator now follows a stricter primary inputs -> calculate -> summary/details shape
- regular investment and ladder were simplified around committed-scenario results rather than strategy theater
- notebook was reframed as a records workspace, not a pseudo-advisory dashboard
- optimizer and multi-asset were narrowed into recovery-lab reference/sorting surfaces
- retirement was narrowed into one limited withdrawal-model flow
- shared calculation shell, shared audit panels, shared recalculate affordances, and shared suspense fallbacks were simplified
- residual motion-heavy page transitions and pulse-heavy status cues were reduced
- heavy retained schedule tables now use a reusable responsive pattern for smaller screens instead of forcing raw horizontal table reading everywhere

### Sharing and Persistence

- single-calculator sharing no longer pretends query params are a stable reconstruction layer
- committed single-scenario snapshots now have their own persisted share model and replay route
- notebook portfolio lifecycle now includes delete support in the retained UI and API

### Calculator Display Truth

- payout-style bonds such as ROR and DOR now present total scenario wealth more coherently in charts and timeline rows
- timeline export and on-screen display derive from a tighter shared display model
- early-exit and net-gain columns are no longer silently flattened to zero in retained timeline output

### Remaining Gaps After The Current Refactor Pass

- full bond-type-by-bond-type math validation is still not complete
- some calculator families remain conditional because support depth is not yet fully proven
- data reliability still needs stronger evidence, especially for broader historical/reference claims
- final manual regression across all retained routes is still required
- production-candidate release review has not yet been earned

## 8. Release Gate for "Production Candidate"

The app cannot be described as production-ready until all are true:

- no known infinite update loops on major pages
- calculator results covered by regression tests for supported scenarios
- data source and sync state visible and current
- recommendation-style copy removed
- calculator UI simplified and stable on desktop/mobile
- performance acceptable on common interactions
- docs reflect real capability and limitations

Additional release-candidate checks that now matter because the UI was narrowed:

- retained-core routes feel coherent as one product instead of separate mini-products
- recovery-lab routes remain intentionally secondary in navigation, copy, and visual emphasis
- trusted/reference/conditional labels do not conflict with actual route behavior
- no visible route still depends on outdated shell cache behavior
- loading and recalculate states stay calm and predictable during common interactions

## 9. Decision Rules During Refactor

When choosing between "fix", "hide", or "remove", use this order:

1. keep and fix only if feature supports core calculator value
2. hide if potentially useful but currently misleading or weak
3. remove from primary UX if it adds complexity without trust

When choosing between "auto-calc" and "calculate button", prefer:

1. auto-calc only for light, stable, predictable flows
2. debounced auto-calc for medium-complexity flows
3. explicit calculation for heavy or fragile flows

## 10. Immediate Next Actions

1. run final manual regression across retained-core and recovery-lab routes
2. finish bond-type and scenario-family trust validation work
3. audit data freshness/sync evidence so visible trust framing stays defensible
4. decide whether any current conditional surface should be promoted, demoted, or held as-is
5. keep feature growth frozen until validation and release-gate evidence improve
6. reconcile any remaining active docs that still lag the implemented recovery state
7. complete final production-candidate narrowing review
