# 25. Roadmap & MVP Definition

This document defines the **reset MVP** after the current product correction.

The previous roadmap assumed broader platform maturity than the application currently supports. The reset MVP narrows the product back to a smaller and more believable release target.

## Reset MVP Goal

Ship a **clear, reliable Polish treasury bond calculator** with supporting education and a limited set of trustworthy secondary flows.

## Reset MVP Scope

## Required

- single bond calculator
- transparent tax/fee/timing handling
- education pages for bond basics
- clear assumptions and warnings
- visible source/freshness for data-backed pages
- responsive and readable UI

## Conditional

These stay in MVP only if validated during refactor:

- comparison calculator
- regular investment calculator
- ladder strategy
- retirement planner

## Deferred Until Stable

- recommendation-style "smart" flows
- broad multi-asset comparison unless data coverage is strong
- portfolio/social expansion
- feature growth that adds state complexity without trust gains

## Delivery Path

## Stage 1. Stabilize

- remove loops and uncontrolled recalculation
- fix sync freshness issues
- reduce page churn and input instability

## Stage 2. Simplify

- redesign forms and controls
- reduce clutter
- remove misleading copy and ranking language

## Stage 3. Verify

- validate calculations per live scenario
- define supported vs unsupported flows
- document limitations clearly

## Stage 4. Polish

- contrast/readability pass
- mobile interaction pass
- performance pass
- documentation pass

## Reset MVP Success Criteria

1. Main calculator flows are stable and understandable.
2. No major calculator page has known infinite update loops.
3. Supported bond scenarios are covered by trustworthy tests.
4. Data-backed screens show real source and freshness information.
5. The app reads like a calculator, not a recommendation engine.
