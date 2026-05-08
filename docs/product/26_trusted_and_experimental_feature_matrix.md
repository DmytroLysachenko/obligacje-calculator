# 26. Trusted and Experimental Feature Matrix

This document defines which application surfaces are currently:

- trusted core flows
- conditionally supported flows
- experimental or limited-support flows

It exists to prevent two recurring problems:

1. treating all pages as equally mature
2. documenting feature existence as if it meant feature readiness

The app is still in refactor and recovery. A page being visible in the UI does **not** automatically mean it is production-ready.

## Classification Rules

### Trusted

A surface is `trusted` only when:

- interaction flow is stable
- no known infinite or near-infinite update loops remain
- copy stays within calculator boundaries
- the page is understandable without feature hunting
- data requirements are sufficiently transparent
- core scenario coverage is believable for current implementation

### Conditional

A surface is `conditional` when:

- the page has real value
- recent refactor work improved stability or clarity
- but the math or scope still needs more validation
- or some supporting data/edge cases remain uncertain

Conditional features may remain in navigation during recovery, but should not be presented as polished or fully validated.

### Experimental or Limited

A surface is `experimental` or `limited` when:

- the underlying assumptions are not strong enough yet
- data depth is weaker than the UI promise
- scope is narrower than a normal user would assume
- or the page still risks being misleading

These features must use conservative copy and may need future downgrading or removal from primary navigation.

## Current Enforcement State

This matrix is no longer only documentation.

The app now enforces part of it directly through UI behavior:

- support labels appear on bond selectors
- family-only bonds are visibly marked instead of presented as generic defaults
- retirement exposes only the narrower supported bond set
- optimizer, multi-asset, and retirement are grouped into a recovery-lab style navigation area
- dashboard/home emphasis now favors trusted, conditional, and reference surfaces over weaker ones
- data-reference pages show source/coverage/as-of state with explicit fallback framing
- shared shell, recalculation, fallback, and status framing now reflect the support classes more consistently

The remaining gap is deeper calculator validation, not only labeling.

## Current Matrix

## 1. Trusted Core

### 1.1 Education

Status: `trusted`

Why:

- core purpose is simple
- product boundary is educational
- recent provider and loading issues were addressed

Remaining expectations:

- content quality can still improve
- but the page class itself is aligned with app purpose
- the calmer loading and page-entry behavior now match its support class more closely

### 1.2 Single Bond Calculator

Status: `trusted core`

Why:

- it is the main product surface
- interaction flow was simplified materially
- explicit recalculation behavior is clearer
- result output is calmer and less cluttered

Still required:

- ongoing math verification across supported bonds and timing combinations
- more targeted regression coverage

Interpretation:

- trusted as the flagship calculator flow
- not yet equivalent to final production certification

### 1.3 Economic Data Reference Page

Status: `trusted reference`

Why:

- page purpose is now narrower and more honest
- source, coverage, fallback, and as-of state are visible
- UI no longer pretends the page is richer than the data

Limit:

- trust applies to reference framing, not to every dataset being perfect

## 2. Conditional Calculators

### 2.1 Comparison

Status: `conditional`

Why:

- recent refactor removed a lot of churn and confusing UI
- explicit comparison flow is much clearer now
- recommendation-style copy was reduced

Why not trusted core yet:

- still needs deeper scenario validation
- still has multiple comparison concepts that may confuse users
- step-by-step value comparison needs continued clarity review
- final manual regression across all entry paths is still needed

Required before trusted promotion:

- supported scenario matrix
- clearer documentation of what is and is not normalized
- more calculation verification
- broader exact-output regression coverage beyond the current flagship baselines

### 2.2 Regular Investment

Status: `conditional`

Why:

- page was simplified heavily
- explicit calculation behavior is clearer
- lot summaries are more understandable

Why not trusted core yet:

- recurring contribution logic needs more systematic math validation
- edge cases around horizon/timing deserve stronger tests
- family-bond scenarios remain conditional even when the base UI is clearer

### 2.3 Ladder

Status: `conditional`

Why:

- maturity schedule UX is now much more honest
- strategy theater was removed
- page now behaves more like a cashflow timing calculator

Why not trusted core yet:

- still relies on the regular-investment engine path
- ladder-specific interpretation needs stronger validation
- should only be promoted after the underlying contribution/timing engine is proven broader than current flagship cases

### 2.4 Notebook

Status: `conditional reference workspace`

Why:

- notebook UI is much simpler and more honest now
- portfolio storage, listing, export, and maturity inspection are useful

Why not trusted core yet:

- portfolio simulation still needs more validation
- notebook should remain descriptive, not analytical-authoritative
- current trust applies more to workspace clarity than to every deeper portfolio-simulation assumption

Rule:

- notebook may summarize and export
- notebook should not behave like an advisory cockpit

## 3. Experimental or Limited Support

### 3.1 Bond Scenario Ranking (`/optimize`)

Status: `experimental`

Why:

- page has been refactored into calmer scenario sorting
- recommendation language was reduced further
- but the core concept still invites over-interpretation

Main limitation:

- a ranked payout list is highly assumption-sensitive
- users can mistake sorting for guidance
- scenario reasons remain heuristics, not suitability logic
- it now sits in recovery-lab emphasis rather than core navigation emphasis
- even after UI simplification, it should not outrank the flagship calculators in trust

Rule:

- keep language strictly neutral
- treat it as an auxiliary calculator, not a flagship flow

Promotion requirements:

- stronger verification of ranking assumptions by bond family
- evidence that scenario reasons do not overclaim meaning
- proof that the page remains interpretable without advisory language

### 3.2 Historical Comparison (`/multi-asset`)

Status: `experimental`

Why:

- page now uses calmer committed-scenario flow and clearer reference framing
- source, coverage, and fallback context are much more visible
- page no longer presents itself like a mature backtesting suite

Main limitation:

- data breadth is still narrower than a strong market-history product would imply
- outcome interpretation remains highly start-date-sensitive
- the feature still depends on reference-quality historical coverage rather than a fully defended research dataset

Rule:

- keep it in recovery-lab emphasis
- keep copy in historical reference terms
- do not promote it as a broad market-vs-bonds verdict engine

Promotion requirements:

- stronger historical coverage evidence
- clearer validation of derived comparison assumptions
- confidence that the feature promise matches the actual dataset depth

### 3.3 Withdrawal Model (`/retirement`)

Status: `limited`

Why:

- page was narrowed substantially into one explicit withdrawal-model flow
- supported bond families are constrained more clearly
- copy now states that the surface is not full retirement advice

Main limitation:

- modeled scope remains narrower than a user may expect from the route concept
- one steady-rate path is inherently less expressive than real retirement planning
- contribution, ladder, and changing-withdrawal behavior are intentionally out of scope

Rule:

- keep it in recovery-lab emphasis
- keep the limitation warning visible
- do not widen its promise before model validation and scope expansion are real

Promotion requirements:

- support boundaries validated against actual engine behavior
- stronger scenario-family testing
- explicit product decision on whether retirement belongs in retained scope at all

## 4. Cross-Cutting Interpretation Rules

These rules should stay true across all classes:

- trusted does not mean production-certified
- conditional does not mean unreliable, but it does mean not fully validated yet
- experimental or limited means the page may still be useful, but the user must see the boundary clearly
- reference framing is acceptable only when source, coverage, and fallback state are visible enough to justify the narrower promise

## 5. Current Practical Reading Of The Product

If a user opens the app today, the most honest interpretation is:

- start with education or the single calculator
- use comparison, regular investment, ladder, and notebook as narrower supporting tools
- use economic data as a reference page, not as proof of macro completeness
- enter recovery-lab pages only when intentionally exploring weaker or narrower surfaces

## 6. What Would Move The Product Forward Next

The highest-value next moves are not more feature count. They are:

- calculator trust validation by supported scenario family
- retained-route manual regression and bug hunting
- stronger sync/data evidence for visible trust labels
- final retained-core narrowing decisions

## 7. Navigation Guidance During Recovery

The current navigation stance is intentionally uneven:

- `primary navigation emphasis`: trusted, conditional, and reference pages
- `recovery-lab emphasis`: optimizer, multi-asset, retirement
- `recovery-lab entry point`: `/recovery-lab` now acts as the explicit doorway for those weaker surfaces

This is acceptable only if:

- the copy is conservative
- the pages are visibly scoped
- docs clearly identify maturity level

If an experimental surface becomes misleading again, it should be:

1. downgraded in wording
2. moved further out of primary emphasis
3. or hidden until recovery work catches up

## 8. Copy Rules By Class

### Trusted Core

Allowed:

- calculator
- scenario
- result
- assumption
- summary

Avoid:

- best option
- winner
- recommendation

### Conditional

Allowed:

- modeled outcome
- comparison under assumptions
- scenario output

Required:

- stronger warnings when scope or assumptions matter materially

### Experimental or Limited

Required:

- explicit framing that the feature is reference-only, limited, or assumption-sensitive
- no personal recommendation language
- no prestige wording that suggests mature institutional analytics

## 9. Engineering Use

This matrix must be consulted when:

- changing navigation prominence
- writing page headers and empty states
- deciding whether a feature stays in MVP
- evaluating whether a plan item is truly complete

No feature should be marked "done" unless its class and justification are also consistent with current reality.

## 10. Current Strongest Evidence

The strongest current evidence for the recovery direction is:

- core calculators now build and ship with calmer explicit recalculation flows
- support-boundary UI is shared instead of ad hoc
- support-matrix regression tests exist
- flagship calculator golden tests now lock exact outputs for representative scenarios
- weaker pages are clearly separated instead of posing as equal-first-class product routes

This means the app is closer to a reliable narrowed calculator product than it was before, but still not done with full recovery.
