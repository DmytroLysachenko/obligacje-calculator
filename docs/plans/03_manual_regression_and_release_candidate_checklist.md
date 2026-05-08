# 03. Manual Regression and Release Candidate Checklist

This checklist exists to finish the recovery refactor responsibly.

The app is materially more coherent than it was before, but there is still a gap between:

- "the retained routes are now simpler and calmer"
- and
- "the retained routes are proven ready for production-candidate review"

This document turns that last gap into a concrete verification pass.

## 1. Purpose

Use this checklist when:

- validating the current recovery build after major refactor batches
- checking whether a route should remain trusted, conditional, or experimental
- deciding whether the app can move from structural cleanup into release-candidate narrowing

Do **not** treat a route as validated only because:

- TypeScript passes
- core engine tests pass
- the page renders once locally
- the route looks visually cleaner

Those are necessary but not sufficient.

## 2. Global Rules

Every retained route should be checked for all of the following:

### 2.1 Open Behavior

- page opens without stale-shell mismatch
- page opens without obvious layout breakage
- page opens without duplicate headers or conflicting UI chrome
- page does not visually jump between old and new shells

### 2.2 Input Behavior

- primary input path is obvious within seconds
- advanced controls are clearly secondary
- numeric input can be entered precisely
- sliders feel optional helpers, not the only way to operate
- controls do not fight direct number entry

### 2.3 Calculation Behavior

- explicit calculate/recalculate behavior is understandable
- dirty-state messaging matches what the user actually changed
- results stay tied to committed assumptions, not raw typing noise
- unrelated sections do not remount on tiny input changes

### 2.4 Result Behavior

- summary is visible before details
- warnings and support notes are readable
- results do not overclaim certainty
- copy does not imply recommendation, suitability, or "best choice"

### 2.5 Trust Framing

- support class shown in navigation matches the page reality
- route-level notices do not conflict with actual behavior
- data/source/fallback framing is visible where relevant
- limited or experimental pages remain visibly secondary

### 2.6 Responsive Behavior

- desktop layout is readable at normal widths
- mobile layout remains operable without horizontal fighting
- sticky or floating controls do not cover critical content
- sidebar/mobile drawer does not trap the user in odd states

## 3. Route Checklist: Trusted Core

## 3.1 Home / Recovery Hub

Route:

- `/`

Checks:

- page behaves like a calm routing hub, not a marketing hero page
- primary route emphasis is still single calculator first
- recovery-lab path remains visibly secondary
- portfolio/notebook resume area does not visually outrank flagship flow
- no stale cached shell returns an older homepage structure

Expected result:

- user can identify the intended main path immediately

## 3.2 Education

Route:

- `/education`

Checks:

- page loads without pulse-heavy placeholder behavior
- loading skeletons are calm and proportional
- concept cards read as education, not marketing claims
- FAQ accordion works without layout jumps
- disclaimer remains readable near bond-type content

Expected result:

- page feels like stable educational context rather than a half-dashboard

## 3.3 Single Calculator

Route:

- `/single-calculator`

Checks:

- one obvious primary input path exists
- advanced settings remain collapsed by default
- savings goal, amount, timing, and bond family can be set cleanly
- exact-value entry works without relying only on sliders
- result summary appears before detailed supporting output
- warnings for invalid amount/date states are visible but not noisy
- share/recalculate affordances do not dominate the route
- route does not flicker or re-run unexpectedly during light edits

Expected result:

- route remains the strongest current product surface

## 3.4 Economic Data

Route:

- `/economic-data`

Checks:

- page clearly reads as reference page, not mature macro terminal
- source/as-of/coverage labels are visible
- fallback framing appears when relevant
- inflation and NBP charts load with calm placeholder behavior
- chart scale controls remain understandable
- text does not imply stronger data depth than actually exists

Expected result:

- route is trustworthy as reference framing even if datasets are still narrower than ideal

## 4. Route Checklist: Conditional

## 4.1 Comparison

Route:

- `/compare`

Checks:

- route-level conditional notice is visible and accurate
- page reads as scenario comparison, not recommendation
- normalized vs independent concepts remain understandable
- ranking/winner language does not reappear in main results
- recalculate flow is explicit and understandable
- results remain tied to committed assumptions
- summary/verdict does not overstate certainty

Expected result:

- route is useful and calm, but still clearly conditional

## 4.2 Regular Investment

Route:

- `/regular-investment`

Checks:

- page follows same shared structure as single calculator
- advanced settings remain secondary
- recurring amount and timing path is understandable
- summary appears before details
- dirty-state messaging is clear
- route does not visually overclaim long-term planning authority

Expected result:

- route feels coherent with flagship calculator but still narrower in trust

## 4.3 Ladder

Route:

- `/ladder`

Checks:

- route-level conditional framing remains visible
- page reads as cashflow/maturity-spacing calculator
- timeline and concentration checks are readable
- strategy theater does not reappear
- results remain committed-scenario based

Expected result:

- route is a calmer timing-analysis tool, not a pseudo-advisory strategy engine

## 4.4 Notebook

Route:

- `/notebook`

Checks:

- page behaves like a records workspace first
- empty state is understandable
- portfolio details read as descriptive, not prescriptive
- exports/shares do not imply analytical authority the engine has not earned
- notebook does not visually collapse back into dashboard clutter

Expected result:

- route remains useful without pretending to be a decision cockpit

## 5. Route Checklist: Recovery Lab

## 5.1 Recovery Lab Index

Route:

- `/recovery-lab`

Checks:

- page clearly explains why these tools are separated
- recovery-lab cards remain intentionally secondary in tone
- card descriptions do not drift into stronger promises than the target routes support

Expected result:

- route acts as explicit doorway to weaker/narrower surfaces

## 5.2 Scenario Ranking

Route:

- `/optimize`

Checks:

- page still reads as experimental
- primary path is amount -> horizon -> purchase date -> calculate ranking
- advanced assumptions are clearly secondary
- ranked list is described as sorting under assumptions
- no recommendation or advisory language appears
- dirty-state/recalculate behavior remains clear

Expected result:

- route remains a supporting scenario sorter, not a flagship product claim

## 5.3 Historical Comparison

Route:

- `/multi-asset`

Checks:

- page still reads as experimental historical reference
- source/coverage/fallback context is visible
- start-date sensitivity is apparent enough from the framing
- recalculate flow is explicit
- charts and breakdowns stay tied to committed scenario
- route does not present itself as a mature backtesting suite

Expected result:

- route remains useful in reference mode only

## 5.4 Withdrawal Model

Route:

- `/retirement`

Checks:

- page still reads as limited support
- primary path is simple and explicit
- advanced assumptions remain secondary
- model-limit warning is visible
- supported bond-family scope is visible
- route does not imply comprehensive retirement planning

Expected result:

- route remains a narrow withdrawal-model tool and nothing broader

## 6. Shared Navigation And Chrome

Checks:

- sidebar trust classes match route maturity
- sync panel does not imply stronger certainty than available metadata supports
- mobile sheet navigation works without broken focus or awkward clipping
- suspense fallback shells look consistent across core routes
- shared audit and recalculate components remain calmer than before

Expected result:

- the app feels like one coherent recovery product

## 7. Release-Candidate Exit Decisions

For each route, choose one:

- `keep as current class`
- `promote`
- `demote`
- `remove from primary emphasis`

Promotion should require:

- stable interaction behavior
- accurate copy
- acceptable data/source truthfulness
- enough scenario validation to support stronger trust

Demotion should happen when:

- the route remains useful but too easy to over-read
- the route promise exceeds the current evidence
- historical/data depth is still too weak
- the math model still feels narrower than the title implies

## 8. Minimum Evidence Before Production-Candidate Review

The app should not enter production-candidate review until all are true:

- this checklist was executed on retained routes
- major findings were resolved or explicitly accepted
- support classes were re-confirmed after testing
- stale-shell mismatch is not reproducible in ordinary use
- visible trust labels still match actual route behavior
- no route relies on hidden UI drama to explain itself

## 9. Suggested Execution Order

1. home
2. education
3. single calculator
4. comparison
5. regular investment
6. ladder
7. notebook
8. economic data
9. recovery-lab index
10. optimizer
11. multi-asset
12. retirement
13. mobile sidebar/navigation pass
14. final retained-core class review

## 10. What Success Looks Like

At the end of this pass, the app should read like:

- one calm Polish treasury bond calculator product
- with a clear retained core
- a visibly separate recovery lab
- honest data/reference framing
- and fewer surprises between what the UI says and what the engine actually supports
