import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const paths = {
  comparisonContainer: 'features/comparison-engine/components/ComparisonContainer.tsx',
  comparisonResults: 'features/comparison-engine/components/ComparisonResultsPanel.tsx',
  multiAssetContainer: 'features/comparison-engine/components/MultiAssetComparisonContainer.tsx',
  multiAssetChart: 'features/comparison-engine/components/MultiAssetComparisonChart.tsx',
  multiAssetChartModel: 'features/comparison-engine/components/multi-asset-chart-model.ts',
  chartTypes: 'features/comparison-engine/types/multi-asset.ts',
  sharedValueChart: 'shared/components/charts/BondValueChart.tsx',
  sharedValueChartParts: 'shared/components/charts/BondValueChartParts.tsx',
  sharedValueChartToolbar: 'shared/components/charts/BondValueChartToolbar.tsx',
  sharedValueChartTooltipParts: 'shared/components/charts/BondValueChartTooltipParts.tsx',
  multiAssetPage: 'app/multi-asset/MultiAssetPageClient.tsx',
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

describe('comparison chart ownership contract', () => {
  it('keeps bond comparison routed through the results panel and shared bond value chart', () => {
    const container = read(paths.comparisonContainer);
    const results = read(paths.comparisonResults);
    const shared = read(paths.sharedValueChart);
    const sharedParts = read(paths.sharedValueChartParts);
    const sharedToolbar = read(paths.sharedValueChartToolbar);
    const sharedTooltipParts = read(paths.sharedValueChartTooltipParts);

    expectContains(container, "import { ComparisonResultsPanel } from './ComparisonResultsPanel';");
    expectContains(container, '<ComparisonResultsPanel');
    expectContains(container, 'chartData={chartData}');
    expectContains(container, 'chartStep={chartStep}');
    expectContains(container, 'onChartStepChange={setChartStep}');
    expectContains(container, "const [chartStep, setChartStep] = useState<ChartStep>('yearly');");

    expectContains(results, 'BondValueChartPoint');
    expectContains(results, "from '@/shared/components/charts/BondValueChart';");
    expectContains(results, '<BondValueChart');
    expectContains(results, 'defaultGranularity={chartStep}');
    expectContains(results, 'onGranularityChange={onChartStepChange}');
    expectContains(results, 'rightDomain={rightDomain}');
    expectContains(results, 'computeRateDomain(');
    expectContains(results, 'valueChartData');
    expectContains(results, 'nominalA');
    expectContains(results, 'realA');
    expectContains(results, 'nominalB');
    expectContains(results, 'realB');
    expectContains(results, 'inflation: point.inflation');
    expectContains(results, 'nbp: point.nbp');

    expectContains(shared, 'showContextControls = true');
    expectContains(shared, 'orientation="right"');
    expectContains(shared, 'width={44}');
    expectContains(shared, '<BondValueChartToolbar');
    expectContains(shared, '<BondValueChartTooltip');
    expectContains(sharedParts, "export { BondValueChartToolbar } from './BondValueChartToolbar';");
    expectContains(sharedToolbar, 'export function BondValueChartToolbar');
    expectContains(sharedTooltipParts, 'export function BondValueChartTooltip');
    expectContains(sharedToolbar, 'aria-pressed={showInflationOverlay}');
    expectContains(sharedToolbar, 'aria-pressed={showNbpOverlay}');

    expectNoFragments(container, [
      './ComparisonChart',
      './MultiAssetComparisonChart',
      '<ComparisonChart',
      '<MultiAssetComparisonChart',
    ]);
    expectNoFragments(results, [
      'from "recharts"',
      "from 'recharts'",
      '<ResponsiveContainer',
      '<ComposedChart',
      '<AreaChart',
      '<Brush',
    ]);
  });

  it('keeps multi-asset comparison routed through its explicitly named chart component', () => {
    const page = read(paths.multiAssetPage);
    const container = read(paths.multiAssetContainer);
    const chart = read(paths.multiAssetChart);
    const chartModel = read(paths.multiAssetChartModel);
    const types = read(paths.chartTypes);

    expectContains(
      page,
      "import { MultiAssetComparisonContainer } from '@/features/comparison-engine/components/MultiAssetComparisonContainer';",
    );
    expectContains(page, '<MultiAssetComparisonContainer />');
    expectContains(
      container,
      "import { MultiAssetComparisonChart } from './MultiAssetComparisonChart';",
    );
    expectContains(container, '<MultiAssetComparisonChart');
    expectContains(container, 'chartData={chartData}');
    expectContains(container, 'assets={assets}');
    expectContains(container, 'showRealValue={showRealValue}');
    expectContains(container, 'formatCurrency={formatCurrency}');

    expectContains(chart, 'export const MultiAssetComparisonChart');
    expectContains(chart, 'React.FC<MultiAssetComparisonChartProps>');
    expectContains(chart, 'thinMultiAssetGrowthData(chartData)');
    expectContains(chart, '<Brush dataKey="date"');
    expectContains(chart, 'const growthLegendItems = React.useMemo');
    expectContains(chart, 'const drawdownLegendItems = React.useMemo');
    expectContains(chart, "ariaLabel={t('comparison.growth_chart_label')}");
    expectContains(chart, "ariaLabel={t('comparison.drawdown_chart_label')}");
    expectContains(chartModel, 'export function thinMultiAssetGrowthData');
    expectContains(chartModel, 'chartData.length > 240');
    expectContains(chartModel, 'createMultiAssetGrowthSummary');
    expectContains(chartModel, 'createMultiAssetDrawdownSummary');

    expectContains(types, 'export interface MultiAssetComparisonChartProps');
    expectContains(types, 'assets: AssetPerformanceSeries[];');
    expectContains(types, 'showRealValue: boolean;');
    expectContains(types, 'formatCurrency: (val: number) => string;');

    expectNoFragments(container, ['./ComparisonChart', '<ComparisonChart']);
    expectNoFragments(chart, [
      'import { ComparisonChartProps',
      'React.FC<ComparisonChartProps>',
      'export const ComparisonChart',
    ]);
  });

  it('prevents ambiguous comparison chart file names from returning', () => {
    const container = read(paths.comparisonContainer);
    const results = read(paths.comparisonResults);
    const multiAssetContainer = read(paths.multiAssetContainer);
    const multiAssetChart = read(paths.multiAssetChart);
    const combinedSources = [container, results, multiAssetContainer, multiAssetChart].join('\n');

    expectNoFragments(combinedSources, [
      'components/ComparisonChart',
      './ComparisonChart',
      'import { ComparisonChartProps',
      'React.FC<ComparisonChartProps>',
      'export const ComparisonChart',
    ]);
    expectContains(combinedSources, 'MultiAssetComparisonChart');
    expectContains(combinedSources, 'ComparisonResultsPanel');
    expectContains(combinedSources, 'BondValueChart');
  });
});
