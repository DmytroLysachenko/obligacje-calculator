# Calculation Stability Rules

This document records the stability rules for calculation routes, scenario handlers, and API error behavior.

The system should prefer explicit rejection over silent coercion.
Users can recover from a clear validation error.
They cannot recover from a successful-looking result that was produced from unsafe input or broken math.

## 1. Request Validation

All calculation requests must be validated before sanitization or calculation.

Validation must reject:

- `NaN`
- `Infinity`
- invalid dates
- withdrawal dates before purchase dates
- fractional month horizons
- missing optimizer horizon
- empty portfolio simulation investments
- custom CPI or NBP paths whose length does not match the modeled horizon

Sanitization remains a defensive layer inside the engine.
It must not be the first line of request handling.

## 2. Math Guard Behavior

The math guard must never return a fake successful result.

If calculation output contains unsafe numbers or an empty timeline, the guard must throw a calculation domain error.

Do not reintroduce:

- `mathWarning: true` success payloads
- zero-profit fallback results
- silent replacement of invalid output with initial capital

Those patterns hide engine faults.

## 3. Cross-Calculator Consistency

When two product flows model the same scenario, they should agree.

Required consistency examples:

- single calculator equals independent comparison for the same bond/input
- portfolio simulation single lot equals matching single-bond scenario
- optimizer result item contains the same result as the matching direct scenario
- rebuy discount changes single and comparison outputs the same way
- custom CPI path changes single and comparison outputs the same way

If a route intentionally differs, the difference must be visible in the payload or documented in assumptions.

## 4. Portfolio Simulation Aggregation

Portfolio aggregation should align by actual timeline dates, not localized display labels.

Rules:

- lots are inactive before their purchase date
- sparse checkpoints carry the latest known value forward
- final summary equals the final aggregate timeline row
- `totalFees` means redemption fees, not early-exit payout values
- staggered lots must stay traceable through `items`

## 5. API Error Shape

Calculation API failures should use stable problem details.

Expected statuses:

- `400` for malformed JSON
- `400` for schema validation errors
- `422` for calculation domain failures
- `429` for rate limits
- `500` for unexpected internal failures

Production responses must not leak stack traces, secrets, SQL details, or raw internal exception messages.

## 6. Fallback Data

Fallback data can be returned successfully when the route is a reference-data route and the fallback is intentionally usable.

Fallback data must remain visible through metadata such as:

- `source`
- `usedFallback`
- `syncStatus`
- `coverageStart`
- `coverageEnd`
- `coverageNote`

Do not hide fallback state behind generic success copy.

## 7. Test Expectations

Every stability change should include tests at the right level:

- schema tests for bad inputs
- engine guard tests for unsafe math
- handler tests for aggregation/consistency
- API mapping tests for public error shape
- docs updates when behavior changes user-visible contracts

Run before commit:

```bash
pnpm test:core
pnpm exec tsc --noEmit
```

Run before handoff:

```bash
pnpm test:ci
pnpm lint
```
