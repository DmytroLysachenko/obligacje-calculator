# 09. Comparative Simulations

This document describes the current comparison surfaces in the app.

The comparison area is intentionally split into two different products:

- bond-vs-bond comparison for two treasury-bond scenarios
- multi-asset reference comparison for historical market context

Neither surface is a recommendation engine. Both are explanatory tools that show modeled assumptions, limits, and trade-offs.

## 1. Bond Comparison

Bond comparison uses the shared bond-value chart renderer instead of a feature-local chart stack.

Current ownership:

- `features/comparison-engine/components/ComparisonContainer.tsx` owns two-scenario state and chart step selection.
- `features/comparison-engine/components/ComparisonResultsPanel.tsx` adapts comparison results into `BondValueChartPoint[]`.
- `shared/components/charts/BondValueChart.tsx` owns chart state, context overlay preferences, and toolbar/plot wiring.
- `shared/components/charts/BondValueChartPlot.tsx` owns the Recharts plot.
- `shared/components/charts/BondValueChartToolbar.tsx` owns legend and overlay controls.
- `shared/components/charts/BondValueChartTooltipParts.tsx` owns grouped tooltip rendering.
- `shared/components/charts/bond-value-tooltip-model.ts` owns tooltip payload decisions.

The chart can show nominal, real, and net-profit metrics plus CPI/NBP context overlays. Comparison scenario groups are passed through the shared tooltip payload model rather than rendered by a separate comparison chart.

## 2. Multi-Asset Reference Comparison

The multi-asset page is a secondary reference surface. It compares S&P 500, gold, EDO bonds, and savings-account paths using available historical/reference data.

Current ownership:

- `features/comparison-engine/components/MultiAssetComparisonContainer.tsx` owns hook wiring, user controls, and page orchestration.
- `features/comparison-engine/components/MultiAssetComparisonPanels.tsx` owns history-state, metric snapshot, and ready-state panels.
- `features/comparison-engine/components/MultiAssetComparisonChart.tsx` owns growth and drawdown charts.
- `features/comparison-engine/components/MultiAssetChartTooltips.tsx` owns chart tooltip rendering.
- `features/comparison-engine/components/multi-asset-chart-model.ts` owns chart rows, thinning, legends, accessibility summaries, total-invested calculation, ending snapshots, and availability summaries.
- `features/comparison-engine/types/multi-asset.ts` owns durable chart and tooltip props.

The page must keep its reference-only framing. If historical coverage is partial or fallback-backed, the UI must show that state through the history panel instead of implying full research-grade completeness.

## 3. Testing

Source contracts intentionally follow concrete ownership after refactors:

- chart ownership: `features/comparison-engine/tests/comparison-chart-scope-contract.test.ts`
- chart verdict and tooltip separation: `features/comparison-engine/tests/comparison-chart-verdict-contract.test.ts`
- multi-asset chart model behavior: `features/comparison-engine/tests/components/multi-asset-chart-model.test.ts`
- design/token boundaries: `docs/ui/design-refactor-contract.test.ts`
