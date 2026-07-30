# Calculation Stability Rules

This document records the stability rules for calculation routes, scenario handlers, and API error behavior.

## Calendar-date contract

Domain dates are canonical ISO calendar dates (`YYYY-MM-DD`), not timestamps.
They are parsed by `IsoCalendarDateSchema`, which verifies Gregorian validity
instead of relying on permissive `Date.parse` behavior. The value crosses an
adapter boundary as a date-only string; presentation uses the selected locale
and UTC-stable formatting. This avoids both impossible dates such as
`2026-02-30` and timezone shifts that turn a purchase date into the adjacent
day.

Imports, calculation inputs, and URL state must reuse this contract. Database
columns remain SQL `date` values and database constraints provide the final
integrity boundary. APIs reject malformed values with field-level validation
details rather than silently normalizing them.

### Required boundary tests

Every adapter adopting the date contract must cover the following cases:

- ordinary month boundaries and both leap-year outcomes;
- a valid leap day (`2024-02-29`) and an invalid one (`2025-02-29`);
- zero and overflow months/days;
- non-padded, localized, timestamp, and whitespace-bearing strings;
- a stored date rendered in Polish and English without changing the day;
- maturity and withdrawal dates at a calculation period boundary.

Tests should generate dates around month ends where practical. A parser may
return the original string only at a display boundary for an existing corrupt
record; untrusted request data is rejected before domain resolution or database
work. Neither the browser nor an API handler should construct a local-midnight
`Date` merely to validate a date-only financial value.

### Migration note

Existing rows are not rewritten by request handling. If an audit finds legacy
invalid values, introduce a reviewed migration with a measured backfill and a
quarantine/report path before adding a stricter database constraint. This keeps
the application runtime free of schema repair and makes rollback reasoning
possible.

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
