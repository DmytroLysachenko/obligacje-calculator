# 01. Long-Term Product Foundation Plan

This document defines the long-term target after the recovery refactor.

It replaces the previous “platform expansion” mindset with a stricter product foundation:

- fewer surfaces
- clearer purpose
- stronger calculations
- lower UI complexity
- honest data handling

## Long-Term Product Goal

Build a **trusted calculator and education product for Polish treasury bonds**.

The product should help users:

- simulate bond outcomes
- inspect taxes, fees, timing, and reinvestment effects
- compare selected bond scenarios
- understand assumptions behind the numbers
- view supporting public data with visible source and freshness

The product should **not** try to act like:

- a financial advisor
- an investment recommender
- a social investing platform
- a broad wealth super-app

## Foundation Pillars

## 1. Calculation Trust First

Long-term target:

- one canonical bond calculation engine
- deterministic outputs
- validated handling of tax, inflation lag, fees, rollover, and timing
- scenario coverage proven by tests, not by UI claims

## 2. UI Simplicity First

Long-term target:

- clear inputs
- minimal surprise
- no unnecessary live recalculation storms
- small number of consistent controls
- accessible contrast and readable result hierarchy

## 3. Data Honesty First

Long-term target:

- every data-backed page shows source, coverage, and freshness
- stale or partial data is clearly marked
- no “unknown” source state on mature pages
- no weak historical feature presented as if it were complete

## 4. Performance as Product Quality

Long-term target:

- no infinite render/update loops
- no full-page churn from minor input edits
- deliberate debouncing and recalculation boundaries
- charts and heavy views mounted only when needed

## 5. Narrower Surface, Better Quality

Long-term target:

- keep only calculators that are correct and understandable
- reduce feature count if needed to protect trust
- ship fewer tools with better quality instead of many weak ones

## Long-Term Product Shape

The preferred mature product shape is:

- education pages explaining bond mechanics
- single bond calculator as primary surface
- comparison calculator for explicit user-defined comparisons
- regular investment / ladder only if clearly modeled and tested
- retirement planner only if its assumptions are narrow, explicit, and bond-specific
- economic data reference pages with real provenance

## Long-Term Delivery Rule

Future work should be prioritized in this order:

1. calculation correctness
2. stability and performance
3. source and sync reliability
4. clarity of inputs/results/copy
5. selective feature retention
6. only then broader expansion

If a feature increases complexity more than trust, it should be cut or postponed.
