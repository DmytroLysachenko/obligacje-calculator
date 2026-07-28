# ADR 30: Chart Display Preference Seam

## Decision

`useChartDisplayPreferences` owns browser display preferences for `BondValueChart`.
The chart remains responsible for toolbar, plot, legend, and accessibility wiring.

## Context

Charts appear in single-bond, regular-investment, ladder, and comparison flows. Each
must retain the same URL key, local-storage key, default granularity, overlay controls,
and accessible toolbar behavior. Embedding browser lifecycle code in the renderer made
that policy difficult to test independently from chart rendering.

## Consequences

- `shared/lib/chart-display-preferences.ts` remains sole storage and URL-key policy.
- `shared/hooks/useChartDisplayPreferences.ts` performs URL hydration, storage writes,
  initial granularity notification, default updates, and overlay changes.
- `BondValueChart` passes its existing props to the hook and preserves controls unchanged.
- Feature charts keep their own `preferenceScope`; no flow shares an implicit scope.
