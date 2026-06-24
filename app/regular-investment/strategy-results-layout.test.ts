import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  regular: 'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  ladder: 'features/ladder-strategy/components/LadderTimeline.tsx',
  density: 'shared/components/results/TableDensityControls.tsx',
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

describe('strategy result layout contracts', () => {
  it('keeps regular investment results on a spacious verdict-to-data rhythm', () => {
    const source = readSource(paths.regular);

    expectContains(source, 'return (<div className="space-y-8">');
    expectContains(source, '<ResultSummaryHero');
    expectContains(source, '<MetricStrip');
    expectContains(
      source,
      'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.75fr)] xl:items-start',
    );
    expectContains(source, '<SectionBlock');
    expectContains(source, 'className="border-y border-border py-6"');
    expectContains(
      source,
      '<span className="ui-meta shrink-0 border-l-2 border-border px-3 py-1 font-semibold">',
    );
    expectContains(source, 'compact');
    expectContains(source, 'className="xl:max-h-[42rem] xl:overflow-y-auto xl:pr-2"');

    expectNoFragments(source, [
      'surface-shell space-y-5 p-5',
      '<span className="surface-chip shrink-0">',
      "import { Badge } from '@/components/ui/badge';",
      '<Badge variant="outline"',
      'grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]',
      'grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]',
      'return (<div className="space-y-6">',
    ]);
  });

  it('keeps regular investment desktop tables premium and readable', () => {
    const source = readSource(paths.regular);

    expectContains(source, '<div className="hidden border-y border-border lg:block">');
    expectContains(source, '<Table className="w-full table-fixed text-sm tabular-nums">');
    expectContains(source, '<TableRow className="h-12 hover:bg-transparent">');
    expectContains(
      source,
      'className="h-14 border-b border-border transition-colors hover:bg-muted/25"',
    );
    expectContains(source, '<TableDensityControls');
    expectContains(source, 'visibleRows={visibleYearlyBuckets.length}');

    expectNoFragments(source, [
      '<TableRow className="bg-muted/35 hover:bg-muted/35">',
      '<div className="hidden overflow-hidden rounded-lg border border-border bg-card lg:block">',
      'hover:bg-muted/35',
      '<div className="hidden lg:block">',
      '<Table className="table-fixed w-full">',
      '<Table className="w-full table-fixed text-sm">',
    ]);
  });

  it('keeps regular recent lots grouped without losing dense financial detail', () => {
    const source = readSource(paths.regular);
    const recentList = readSource('shared/components/results/RecentLotList.tsx');

    expectContains(
      source,
      "import { RecentLotList, RecentLotDisplayItem } from '@/shared/components/results/RecentLotList';",
    );
    expectContains(source, 'const recentLotItems = useMemo<RecentLotDisplayItem[]>(() =>');
    expectContains(source, '<RecentLotList');
    expectContains(recentList, 'space-y-5 border-y border-border py-6');
    expectContains(recentList, 'className?: string;');
    expectContains(recentList, 'compact?: boolean;');
    expectContains(recentList, "compact ? 'space-y-1.5' : 'space-y-2'");
    expectContains(recentList, "compact ? 'px-3 py-2' : 'px-4 py-3'");
    expectContains(
      recentList,
      "compact ? 'py-3 first:pt-0 last:pb-0' : 'py-4 first:pt-0 last:pb-0'",
    );
    expectContains(recentList, "compact ? 'mt-3 gap-y-2.5' : 'mt-4 gap-y-3'");
    expectContains(recentList, 'divide-y divide-border');
    expectContains(
      recentList,
      'grid grid-cols-2 gap-x-6 text-sm md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4',
    );

    expectNoFragments(source, [
      'grid grid-cols-1 gap-3',
      'mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4',
      'rounded-lg border border-border bg-card p-4',
      'surface-shell space-y-5 p-5',
    ]);
    expectNoFragments(recentList, [
      '<section className="space-y-5 border-y border-border py-6">',
      '<p className="ui-body text-muted-foreground">{description}</p>',
      '<article key={item.key} className="py-4 first:pt-0 last:pb-0">',
      'mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm',
    ]);
  });

  it('keeps ladder result metrics in shared grouped metric strips', () => {
    const source = readSource(paths.ladder);

    expectContains(
      source,
      "import { MetricStrip } from '@/shared/components/results/MetricStrip';",
    );
    expectContains(source, '<MetricStrip');
    expectContains(source, 'columns="grid-cols-1 md:grid-cols-3"');
    expectContains(source, 'return (<div className="space-y-8">');

    expectNoFragments(source, [
      "import { ResultMetricCard } from '@/shared/components/results/ResultMetricCard';",
      '<ResultMetricCard',
      'grid grid-cols-1 gap-4 md:grid-cols-3',
      'return (<div className="space-y-6">',
    ]);
  });

  it('keeps ladder chart and maturity table separated by stronger surface rhythm', () => {
    const source = readSource(paths.ladder);

    expectContains(source, '<ChartSection');
    expectContains(source, 'className="border-y border-border py-6"');
    expectContains(source, '<SectionBlock');
    expectContains(
      source,
      "const [chartMode, setChartMode] = useState<LadderChartMode>('yearly');",
    );
    expectContains(
      source,
      'const yearlyBuckets = useMemo<LadderYearBucket[]>(() => buildLadderYearBuckets(monthlyBuckets), [monthlyBuckets]);',
    );
    expectContains(source, 'const chartData = useMemo(');
    expectContains(source, 't(`ladder_page.timeline.chart_modes.${mode}`)');
    expectContains(source, '<div className="hidden border-y border-border lg:block">');
    expectContains(source, '<Table className="w-full table-fixed text-sm tabular-nums">');
    expectContains(source, '<TableRow className="h-12 hover:bg-transparent">');
    expectContains(
      source,
      'className="h-14 border-b border-border transition-colors hover:bg-muted/25"',
    );
    expectContains(source, '<TableDensityControls');

    expectNoFragments(source, [
      '<div className="hidden overflow-hidden rounded-lg border border-border bg-card lg:block">',
      'surface-shell space-y-5 p-5',
      'surface-shell border-t-0 p-5',
      '<Table className="table-fixed w-full">',
      '<Table className="w-full table-fixed text-sm">',
      'transition-colors hover:bg-muted/35',
      '<section className="space-y-6 border-t border-border py-6">',
    ]);
  });

  it('keeps table density control available for long strategy lists', () => {
    const source = readSource(paths.density);

    expectContains(source, "export type TableRowLimit = 12 | 24 | 50 | 'all';");
    expectContains(
      source,
      "export const tableRowLimitOptions: TableRowLimit[] = [12, 24, 50, 'all'];",
    );
    expectContains(source, 'labels.rowsShown');
    expectContains(source, 'labels.rowsPerPage');
  });
});
