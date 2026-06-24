import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  chart: 'features/comparison-engine/components/MultiAssetComparisonChart.tsx',
  resultsPanel: 'features/comparison-engine/components/ComparisonResultsPanel.tsx',
  sharedValueChart: 'shared/components/charts/BondValueChart.tsx',
  verdict: 'features/comparison-engine/components/ComparisonVerdict.tsx',
  chartLegendContract: 'shared/components/charts/chart-legend-contract.test.ts',
  resultsContract: 'features/comparison-engine/tests/comparison-results-surface-contract.test.ts',
  resultsPanelTypes: 'features/comparison-engine/types/comparison-results-panel.ts',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expectNotContains(source, fragment);
  }
}

describe('comparison chart and verdict contracts', () => {
  it('keeps multi-asset charts scoped away from bond comparison charts', () => {
    const source = read(files.chart);

    expectContains(source, 'export const MultiAssetComparisonChart');
    expectContains(source, 'MultiAssetComparisonChartProps');
    expectContains(
      source,
      "import { ChartLegendStrip } from '@/shared/components/charts/ChartLegendStrip';",
    );
    expectContains(source, 'const growthLegendItems = React.useMemo(');
    expectContains(source, '() => createMultiAssetGrowthLegendItems(assets),');
    expectContains(source, 'const drawdownLegendItems = React.useMemo(');
    expectContains(source, '() => createMultiAssetDrawdownLegendItems(assets),');
    expectContains(source, '<ChartLegendStrip items={growthLegendItems} />');
    expectContains(source, '<ChartLegendStrip items={drawdownLegendItems} />');
    expectContains(source, 'const inflation = data.inflation;');
    expectContains(source, 'const nbp = data.nbp;');
    expectContains(source, "{t('bonds.ref_inflation')}:");
    expectContains(source, "{t('bonds.nbp_rate_short')}:");

    expectNoFragments(source, [
      'Legend,',
      '<Legend',
      'wrapperStyle',
      'height={40}',
      'yAxisId="right"',
      'dataKey="inflation"',
      'dataKey="nbp"',
      'name={t("bonds.ref_inflation")}',
      'name={t("bonds.nbp_rate_short")}',
    ]);
  });

  it('keeps bond comparison on the shared value chart renderer', () => {
    const source = read(files.resultsPanel);
    const types = read(files.resultsPanelTypes);
    const sharedChart = read(files.sharedValueChart);

    expectContains(source, "from '@/shared/components/charts/BondValueChart';");
    expectContains(source, 'BondValueChart,');
    expectContains(source, 'BondValueChartPoint');
    expectContains(source, '<BondValueChart');
    expectContains(source, 'defaultGranularity={chartStep}');
    expectContains(source, 'onGranularityChange={onChartStepChange}');
    expectContains(types, 'scenarioAColor: string;');
    expectContains(types, 'scenarioBColor: string;');
    expectContains(source, 'color: scenarioAColor');
    expectContains(source, 'color: scenarioBColor');
    expectContains(source, 'rightDomain={rightDomain}');
    expectContains(sharedChart, 'showContextControls = true');
    expectContains(sharedChart, 'dataKey="inflation"');
    expectContains(sharedChart, 'dataKey="nbp"');

    expectNoFragments(source, [
      'AreaChart',
      'LineChart,',
      '<Legend',
      'Brush',
      './ComparisonChart',
      '<ComparisonChart ',
      './MultiAssetComparisonChart',
      '<MultiAssetComparisonChart',
    ]);
  });

  it('keeps comparison verdict badges divider-led instead of pill-heavy', () => {
    const source = read(files.verdict);

    expectContains(source, 'flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4');
    expectContains(
      source,
      'inline-flex items-center gap-2 border-l-2 border-border pl-3 text-xs font-semibold text-muted-foreground',
    );
    expectContains(
      source,
      'inline-flex items-center gap-2 border-l-2 border-warning pl-3 text-xs font-semibold text-warning',
    );
    expectContains(source, 'border-l-2 border-border px-4 py-4 text-center');
    expectContains(source, '<Scale className="h-3 w-3" />');
    expectContains(source, '<ShieldCheck className="h-3 w-3" />');
    expectContains(source, '<Zap className="h-3 w-3" />');

    expectNoFragments(source, [
      "import { Badge } from '@/components/ui/badge';",
      '<Badge',
      '</Badge>',
      'border-border bg-muted/35 text-xs font-semibold text-muted-foreground',
      'border-warning/30 bg-warning/10 text-xs font-semibold text-warning',
      'bg-muted/35 px-4 py-4 text-center',
    ]);
  });

  it('keeps comparison cleanup covered by broader chart and surface contracts', () => {
    const chartLegendContract = read(files.chartLegendContract);
    const resultsContract = read(files.resultsContract);

    expectContains(chartLegendContract, 'keeps chart legend strip readable and divider-led');
    expectContains(resultsContract, 'keeps comparison cards and empty steps divider-led');
    expectContains(resultsContract, 'keeps two-scenario export actions inline with results');
  });
});
