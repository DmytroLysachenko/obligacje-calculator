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

## Authoritative calculation context

Calculation cache entries are an optimization, never the source of financial
truth. Each key combines the normalized scenario request with the model version
and declared freshness/revision metadata. The service loads independent
definitions and freshness concurrently before it chooses an entry, so a cached
result always names the authority it was calculated against.

Entries have a short explicit TTL. A completed synchronization can invalidate
the matching namespace immediately; expiry remains a safe fallback if an
invalidation signal is delayed or a process is recycled. Cache values do not
cross an instance boundary as correctness state: two instances receiving the
same declared context must calculate the same result whether either has a warm
entry or not.

When adding a new authoritative input, apply all of the following in one
delivery:

1. include its stable revision in the cache identity;
2. expose it in calculation diagnostics/freshness where user understanding
   needs it;
3. add hit, changed-revision, expiry, and invalidation tests; and
4. document how a successful synchronization invalidates the old namespace.

Do not serialize a mutable full database response as a revision contract. Use
the smallest stable metadata needed to decide whether the financial inputs are
the same, and keep user-specific data out of the shared cache key.

### Incident response

If an authoritative source is corrected, operators record the affected revision
and invalidate its cache namespace before describing the result as current. The
next calculation must show the replacement freshness metadata. A cache issue is
investigated with the normalized request, declared revisions, model version,
entry age, and correlation identifier—never with saved customer inputs or
credentials. This preserves reproducibility while keeping operational logs
privacy-safe.

Cache invalidation is idempotent. Repeating it is safe; omitting it is not.

Expiry is the final guardrail.

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
# Calculation Stability Rules

## Session ownership and persisted results

Calculator inputs are draft state. A result becomes committed state only after
the calculation that started with that exact draft successfully resolves while
it is still the current request. Starting a newer calculation or unmounting a
calculator invalidates older completions; an older response may settle its own
promise but must never overwrite committed output.

Cancellation is explicit, never a successful `null` result. Persisted sessions
retain drafts separately from committed results and restore a result only when
its model version matches the active calculator model. Stale results are
discarded while the user's draft remains available for recalculation.

## Required implementation sequence

1. Validate and normalize an input before starting external work.
2. Record the current execution epoch with the exact normalized draft.
3. Abort or supersede any prior client request through the shared request hook.
4. Commit result and committed inputs only when the execution epoch is current.
5. Keep the prior committed result visible while a new draft is dirty or while
   a new request is running; do not flash a false successful empty state.
6. On cancellation, clear only the active progress state. Do not create an
   error, mutate committed inputs, or persist a synthetic result.
7. On failure, expose a safe error for the active request only. A later
   successful request owns the final session state.

## Persistence compatibility

Storage keys are an implementation detail, not a model-version contract. Every
persisted session therefore contains both editable draft inputs and optional
committed output. The restore boundary calls a model-version validator before
accepting the output. It must reject missing, malformed, or old envelopes.

This policy intentionally favors an available user draft over an apparently
convenient but unverifiable financial result. A recalculation against the
current offer/data revision is required before presenting updated output.

## Verification

- Unit-test the execution epoch for overlapping requests and unmount.
- Unit-test version validation for current, old, and malformed envelopes.
- Test reducer transitions for cancellation, failure, successful commitment,
  and draft edits after a result.
- Add a browser or component interaction test when a calculator changes the
  visible progress, focus, error, or result hierarchy.
