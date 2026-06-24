# 04. Post-Refactor Polish and Hardening Plan

This document defines the next work phase after the broad recovery refactor.

The app is now materially calmer, narrower, and more honest than it was before.
That does **not** mean it is ready to stop improving.

The remaining work is less about rescuing product structure and more about:

- consistency
- edge-case handling
- i18n truthfulness
- interaction polish
- accessibility
- route-by-route hardening
- release-candidate confidence

This plan exists so the team does not drift from:

- "the structure is finally sane"

into:

- "ship it, the rest is cosmetic"

That would be the wrong read.

The remaining work is not only cosmetic.
It is the work that turns a narrowed refactor into a believable candidate for serious use.

## 1. Scope of This Plan

This plan covers the post-refactor polish layer for the retained application.

It focuses on:

- i18n recheck and translation quality
- UI polish and consistency
- UX improvements inside the retained model
- edge-case handling and validation behavior
- route-specific hardening
- accessibility and readability
- release-candidate support work

It does **not** reopen broad feature growth.

It does **not** authorize:

- new calculator families
- renewed "smart recommendation" behavior
- new dashboard complexity
- stronger product promises without validation

## 2. Why A Separate Plan Is Needed

The recovery refactor solved a large class of problems:

- pages looked like separate products
- shared shells were inconsistent
- recommendation-adjacent language leaked into the UI
- stale shell caching caused conflicting page versions
- loading states and recalculation behavior were noisy
- weaker pages competed visually with stronger ones

That work was structural.

The next phase is different.

The next risks are subtler:

- partial translation drift
- small but repeated input friction
- inconsistent empty/loading/error behavior
- weak mobile details
- edge cases that only appear under real usage
- copy that is technically true but still awkward
- visually uneven route polish

These are not the same kind of problems as the earlier refactor.
They need their own checklist, priorities, and acceptance criteria.

## 3. Current Baseline Assumption

This plan assumes:

- retained-core route structure is mostly settled
- recovery-lab separation remains intentional
- calculator flows now use committed calculations much more broadly
- structural UI rescue work is no longer the main bottleneck

If those assumptions stop being true, return to the recovery-refactor plan first.

## 4. Product Position During This Phase

During this phase, the app should still be treated as:

- refactor-recovered
- narrowing toward release-candidate quality
- not yet production-ready

The team should describe the product as:

- simpler than before
- calmer than before
- more honest than before
- still undergoing validation and hardening

## 5. Core Objectives

### Objective 1. Remove Translation and Copy Drift

The app should not feel like:

- one route was polished in English only
- another route was updated but not localized cleanly
- some labels still belong to an older product era

### Objective 2. Make Retained Routes Feel Finished

"Finished" here does not mean final production certification.
It means:

- consistent visual hierarchy
- reduced small frictions
- predictable controls
- less awkward spacing, sizing, and copy

### Objective 3. Catch Real-World Input and Scenario Edges

Users do not operate only on golden-path defaults.

The app must behave better around:

- exact numeric entry
- weird but valid ranges
- incomplete input states
- fallback data states
- route resume and reload behavior

### Objective 4. Improve UX Without Re-Adding Complexity

Any polish work that adds:

- extra UI theater
- more floating widgets
- more live churn
- more feature branches

is a regression, not an improvement.

### Objective 5. Prepare For Release-Candidate Decisions

This phase should make it easier to say:

- retain
- demote
- remove
- promote

with evidence rather than intuition.

## 6. Workstreams

## Workstream A. i18n Recheck and Translation Integrity

### Goals

- eliminate translation drift
- remove mixed old/new product naming
- ensure recovery framing is consistent in both languages
- reduce awkward phrasing in labels, tooltips, notices, and empty states

### Current Risks

- some strings still reflect earlier product ambition
- some pages may be cleaner in one language than the other
- route framing may not match the support-class language equally well in both locales
- translation keys may exist for concepts no longer favored in current UX

### Concrete Tasks

- audit all retained-core route headers in `en` and `pl`
- audit all recovery-lab route warnings and notices in `en` and `pl`
- audit support-class labels and notices in shared components
- audit empty-state copy on all calculators
- audit result-summary language for awkward literal phrasing
- audit chart labels and reference metadata copy for consistency
- review whether "calculator", "scenario", "reference", "comparison", and "withdrawal model" are expressed consistently
- identify outdated labels such as legacy "smart", "winner", or overconfident phrasing that still remain in translation files
- remove unused or misleading keys where feasible
- normalize capitalization style across navigation and section headers

### Acceptance Criteria

- both supported locales express the same product boundary
- no major retained route feels "unfinished in one language"
- shared notices read naturally in both locales
- no route header or CTA implies stronger capability in one language than the other

## Workstream B. UI Consistency Polish

### Goals

- make the retained app feel visually coherent
- reduce small inconsistencies that create friction
- improve hierarchy without adding decorative noise

### Current Risks

- card spacing may differ too much between routes
- section headers may use slightly different visual grammar
- summary cards may vary more than necessary
- route-level notices may be semantically consistent but visually uneven
- some fallback/empty states may still feel more provisional than others

### Concrete Tasks

- audit spacing rhythm on retained pages
- audit heading scale and section spacing across retained routes
- audit shared card border, radius, and density usage
- standardize summary-card information hierarchy further where useful
- standardize empty-state vertical rhythm
- standardize sticky or floating control placement across heavy routes
- standardize route-level notice density and width
- reduce leftover overly bold or overly faint text treatments
- review whether any route still visually overuses dashed borders or muted blocks
- normalize action button prominence so calculate/recalculate stays primary where intended

### Acceptance Criteria

- routes feel related without becoming visually identical
- summary areas are readable at a glance
- support notices do not crowd primary content
- no page stands out for "accidental" styling differences

## Workstream C. UX Improvements Inside The Narrowed Product

### Goals

- improve ease of use inside the current product shape
- reduce confusion around committed vs dirty state
- improve learnability without expanding scope

### Current Risks

- some users may still not understand why a page needs recalculation
- advanced sections may be technically collapsed but still conceptually dense
- reference pages may still require too much interpretation
- notebook and comparison flows may still need clearer sequencing cues

### Concrete Tasks

- audit dirty-state messaging across calculators
- review whether calculate/recalculate CTA wording is optimal on each route
- ensure primary inputs are visible before secondary options on every heavy route
- improve inline explanation where a single sentence can remove confusion
- review when to show supporting notes immediately versus after results
- reduce any remaining "what should I do next?" gaps in empty states
- improve pathway from home to flagship route, then to secondary tools
- check whether notebook and comparison routes need clearer first-action cues
- confirm that recovery-lab entry still feels intentional rather than accidental

### Acceptance Criteria

- new users can identify the main action quickly
- dirty-state warnings explain themselves without sounding alarming
- advanced options remain available without becoming the visual default
- empty states point toward action, not just absence

## Workstream D. Edge Cases and Input Hardening

### Goals

- make the app robust under non-default usage
- reduce fragile or awkward input states
- improve validation clarity without overbearing error UX

### Current Risks

- numeric entry may still be awkward at boundaries
- sliders may still be too noisy in certain scenarios
- some exact-date/timing states may remain underexplained
- tax wrapper and special-scope options may expose edge conditions inconsistently
- fallback/no-data states may still be too generic

### Concrete Tasks

- audit zero, near-zero, and max-range inputs on retained calculators
- audit exact date edge states and future-date handling
- audit negative or impossible values where browser inputs allow them
- audit bond-type switch behavior when assumptions become invalid
- audit toggles that reveal nested fields
- check family-bond eligibility framing under partial or changed inputs
- check tax wrapper limit toggles and related helper text
- verify custom tax-rate flow on single calculator
- verify large-horizon and short-horizon boundary behavior
- verify historical start-date edge handling on multi-asset
- improve no-results or no-history messaging where necessary
- document route-specific edge cases that should become tests later

### Acceptance Criteria

- validation states are clear and calm
- no obvious broken or misleading input combinations survive normal usage
- edge-case handling feels intentional rather than accidental
- important boundary cases are at least documented if not fully automated yet

## Workstream E. Loading, Empty, and Error State Finalization

### Goals

- make all non-happy-path states feel intentional
- ensure placeholders do not contradict support framing
- reduce the gap between "working route" and "degraded route"

### Current Risks

- some routes may still load more abruptly than others
- some fallback states may be technically correct but emotionally vague
- some empty states may not explain what action unlocks the route
- some error states may still be too generic

### Concrete Tasks

- audit suspense fallback usage on all retained routes
- audit empty-state tone on calculator routes
- audit no-data states on reference routes
- audit route-level error messaging on charts and data panels
- ensure loading states do not mimic a richer dataset than exists
- confirm shared fallback shell remains appropriate for both home and retained calculators
- reduce places where raw text like "Loading..." still leaks through
- define route-specific fallback messages only where the shared one is too generic

### Acceptance Criteria

- no major retained route falls back to low-quality placeholder text
- loading states are calmer and consistent
- empty states explain what action is missing
- data/reference degraded states remain honest

## Workstream F. Accessibility and Readability

### Goals

- improve clarity for keyboard, screen, and lower-contrast users
- reduce visual hunting
- ensure warnings and important metadata are actually readable

### Current Risks

- some muted text may still be too faint for importance level
- some button or switch contexts may need stronger accessible labeling
- card density could still create scan difficulty on some routes
- support-class pills may be visible but not sufficiently explanatory by context

### Concrete Tasks

- audit keyboard navigation on retained-core routes
- audit focus visibility on shared controls
- audit switch labeling context on calculator routes
- audit chart control labeling and toggle clarity
- audit contrast of metadata text, helper text, and warning text
- review small uppercase text usage for overcompression
- review mobile readability of summary cards and trust notices
- audit whether icons carry meaning without enough text backup

### Acceptance Criteria

- keyboard path through primary calculator actions is clear
- important labels and warning text are readable without strain
- assistive interpretation of key toggles/buttons is stronger
- readability improves without adding visual clutter

## Workstream G. Mobile and Narrow-Screen Refinement

### Goals

- ensure retained routes remain usable on smaller screens
- reduce layout tension in cards, charts, and control groups

### Current Risks

- sticky/floating controls may cover content
- summary cards may wrap awkwardly
- sidebars or drawer content may become dense
- charts and tables may remain readable only on desktop

### Concrete Tasks

- audit all retained routes at common mobile widths
- audit recalculate button overlap and placement on mobile
- audit card wrapping for summary rows
- audit chart container readability and overflow
- audit notebook/detail panels on narrow widths
- audit mobile sheet navigation density
- adjust spacing, stacking, and copy length where mobile breaks clarity

### Acceptance Criteria

- primary actions remain obvious on mobile
- floating elements do not block important information
- summary and warning content stays readable
- mobile feels intentionally supported, not merely tolerated

## Workstream H. Route-Specific Finish Pass

### Goals

- give each retained route a small final polish pass
- capture remaining route-specific improvement items without reopening architecture

### Route List

- home
- education
- single calculator
- comparison
- regular investment
- ladder
- notebook
- economic data
- recovery-lab index
- optimizer
- multi-asset
- retirement

### Route Pass Questions

For each route, ask:

1. Is the first action obvious?
2. Is the support class accurately reflected?
3. Is the copy calm and honest?
4. Are empty/loading/error states good enough?
5. Are edge-case controls handled well?
6. Does the route feel polished relative to its intended maturity class?

### Acceptance Criteria

- each route has a short finish-pass conclusion
- route-level rough edges are either fixed or explicitly deferred
- no retained route feels like it missed the recovery cleanup wave

## Workstream I. Code and Component Hardening

### Goals

- support the polish phase with maintainable component cleanup
- reduce small sources of future inconsistency

### Current Risks

- minor duplicated route framing may reappear
- route-level polish changes could drift without shared helpers
- some shared component APIs may still be broader or rougher than necessary

### Concrete Tasks

- review whether repeated notice/summary patterns should be slightly more shared
- prune dead or now-obsolete helper code where safe
- review translation-key sprawl after copy cleanup
- document component usage rules where repeated mistakes are likely
- keep shared components simple rather than over-generalized

### Acceptance Criteria

- polish work does not increase long-term entropy
- shared components stay understandable
- copy and support-class logic are easier to maintain

## 7. Delivery Order

Recommended execution order:

1. i18n recheck
2. loading/empty/error state finalization
3. edge-case and input hardening
4. UI consistency polish
5. UX improvements in retained routes
6. accessibility and readability pass
7. mobile refinement
8. route-specific finish pass
9. code/component hardening cleanup
10. final release-candidate review preparation

This order is intentional.

Reason:

- translation and state handling influence everything else
- edge-case handling should happen before calling a route "polished"
- route-specific finish passes make more sense after shared polish rules settle

## 8. What Success Looks Like

When this plan is executed well:

- the app still feels narrow and honest
- but also feels more deliberate and finished
- both supported locales feel equally cared for
- retained routes share a coherent polish level
- edge-case behavior feels calmer and less surprising
- the app is easier to evaluate for production-candidate scope

## 9. What This Plan Should Not Become

This plan should **not** become:

- a backdoor to feature growth
- a justification for reintroducing flashy motion
- a vague "maybe improve anything later" bucket
- a never-ending cosmetic cleanup loop

If a task:

- changes product scope
- adds major state complexity
- reopens advisory-style behavior
- or widens promises without evidence

then it belongs in a different plan and should be challenged.

## 10. Suggested Outputs

The likely outputs of this phase are:

- improved translation files
- refined route copy
- minor component polish commits
- route-by-route edge-case fixes
- accessibility/readability improvements
- a shorter list of remaining promotion/demotion questions

## 11. Exit Criteria

This post-refactor polish and hardening phase can be considered complete when:

- retained routes feel visually and behaviorally coherent
- i18n drift is materially reduced
- major edge cases have been reviewed and either fixed or documented
- empty/loading/error states are consistently intentional
- accessibility/readability issues on primary flows are reduced
- mobile behavior on retained routes is acceptable
- route-specific finish passes are recorded
- remaining open work is mainly calculation-trust or data-depth validation, not polish debt

## 12. Relationship to Other Active Plans

This plan is downstream from:

- `02_full_app_refactor_and_recovery_plan.md`
- `03_manual_regression_and_release_candidate_checklist.md`

Use this plan when the structural recovery work is mostly complete and the product needs finish-quality hardening.

Use the manual regression checklist when validating actual route behavior.

Use the recovery plan when deciding whether broader structural rescue work is still required.

## 13. Immediate Next Actions

1. audit `en` and `pl` route framing on retained-core and recovery-lab pages
2. list all raw or low-quality fallback/loading texts still visible in the app
3. run an edge-case pass on the single calculator, comparison, regular investment, ladder, and retirement routes
4. review sidebar/mobile drawer and floating recalculate behavior on narrow screens
5. capture route-specific polish findings in a small execution log or checklist update
