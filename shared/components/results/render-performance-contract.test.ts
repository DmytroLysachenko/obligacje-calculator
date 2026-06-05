import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const projectRoot = process.cwd();

const paths = {
  metricStrip: 'shared/components/results/MetricStrip.tsx',
  resultHero: 'shared/components/results/ResultSummaryHero.tsx',
  recentLotList: 'shared/components/results/RecentLotList.tsx',
  chartLegend: 'shared/components/charts/ChartLegendStrip.tsx',
  singleSummary: 'features/single-calculator/components/BondResultsSummary.tsx',
  regularSummary: 'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  ladderTimeline: 'features/ladder-strategy/components/LadderTimeline.tsx',
} as const;

function readSource(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
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

describe('result render performance contracts', () => {
  it('memoizes shared presentational result components', () => {
    const metricStrip = readSource(paths.metricStrip);
    const resultHero = readSource(paths.resultHero);
    const recentLotList = readSource(paths.recentLotList);
    const chartLegend = readSource(paths.chartLegend);

    expectContains(metricStrip, 'export const MetricStrip = React.memo(function MetricStrip');
    expectContains(resultHero, 'export const ResultSummaryHero = React.memo(function ResultSummaryHero');
    expectContains(recentLotList, 'export const RecentLotList = React.memo(function RecentLotList');
    expectContains(chartLegend, 'export const ChartLegendStrip = React.memo(function ChartLegendStrip');

    expectNoFragments(metricStrip, [
      'export function MetricStrip',
      'export default function MetricStrip',
    ]);
    expectNoFragments(resultHero, [
      'export function ResultSummaryHero',
      'export default function ResultSummaryHero',
    ]);
    expectNoFragments(recentLotList, [
      'export function RecentLotList',
      'export default function RecentLotList',
    ]);
    expectNoFragments(chartLegend, [
      'export function ChartLegendStrip',
      'export default function ChartLegendStrip',
    ]);
  });

  it('keeps single calculator summary arrays and actions stable between renders', () => {
    const source = readSource(paths.singleSummary);

    expectContains(source, 'const formatCurrency = React.useCallback(');
    expectContains(source, 'const handleExportCSV = React.useCallback(');
    expectContains(source, 'const primarySummaryCards = React.useMemo(() => [');
    expectContains(source, 'const secondarySummaryCards = React.useMemo(() => [');
    expectContains(source, 'const metricItems = React.useMemo(');
    expectContains(source, 'const scenarioFacts = React.useMemo(() => [');
    expectContains(source, 'const summaryActions = React.useMemo(() => [');
    expectContains(source, '<MetricStrip items={metricItems}/>');
    expectContains(source, 'actions={summaryActions}');

    expectNoFragments(source, [
      '<MetricStrip items={[...primarySummaryCards, ...secondarySummaryCards]}/>',
      'actions={[',
      'const handleExportCSV = () => {',
      'const formatCurrency = (value: number) => currencyFormatter.format(value);',
    ]);
  });

  it('keeps regular investment result metrics and export action stable', () => {
    const source = readSource(paths.regularSummary);

    expectContains(source, 'const currencyFormatter = useMemo(() => new Intl.NumberFormat');
    expectContains(source, 'const formatCurrency = useCallback(');
    expectContains(source, 'const primaryStats = useMemo<SummaryStat[]>(() => [');
    expectContains(source, 'const supportingStats = useMemo<SummaryStat[]>(() => [');
    expectContains(source, 'const handleExport = useCallback(() => {');
    expectContains(source, 'const recentLotItems = useMemo<RecentLotDisplayItem[]>(() =>');
    expectContains(source, '<RecentLotList');
    expectContains(source, 'const summaryActions = useMemo(() => [');
    expectContains(source, 'actions={summaryActions}');

    expectNoFragments(source, [
      'const primaryStats: SummaryStat[] = [',
      'const supportingStats: SummaryStat[] = [',
      'const handleExport = () => {',
      'actions={[',
    ]);
  });

  it('keeps ladder chart data and metric strip props memoized', () => {
    const source = readSource(paths.ladderTimeline);

    expectContains(source, 'const formatCurrency = useCallback(');
    expectContains(source, 'const chartData = useMemo(');
    expectContains(source, 'const metricItems = useMemo(() => [');
    expectContains(source, 'items={metricItems}');

    expectNoFragments(source, [
      "const chartData = chartMode === 'yearly' ? yearlyBuckets : monthlyBuckets;",
      'items={[',
      'const formatCurrency = (value: number) => currencyFormatter.format(value);',
    ]);
  });
});
