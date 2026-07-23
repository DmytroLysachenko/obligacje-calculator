import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  regularSummary: 'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  regularYearly: 'features/regular-investment/components/RegularInvestmentYearlyBucketsSection.tsx',
  recentLots: 'shared/components/results/RecentLotList.tsx',
  ladder: 'features/ladder-strategy/components/LadderTimeline.tsx',
  ladderSections: 'features/ladder-strategy/components/LadderTimelineSections.tsx',
  ladderTable: 'features/ladder-strategy/components/LadderTimelineTable.tsx',
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

describe('strategy result flow contracts', () => {
  it('keeps the regular investment summary grid from creating a full-height right rail', () => {
    const source = read(files.regularSummary);
    const yearly = read(files.regularYearly);

    expectContains(
      source,
      'grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.75fr)] xl:items-start',
    );
    expectContains(source, '<RecentLotList');
    expectContains(source, 'compact');
    expectContains(source, 'initialItemCount={5}');
    expectContains(source, "showLessLabel={t('common.show_less')}");
    expectContains(source, '<RegularInvestmentYearlyBucketsSection');
    expectContains(yearly, '<SectionBlock');
    expectContains(yearly, '<ResponsiveTableSheet');
    expectContains(yearly, '<TableDensityControls');

    expectNoFragments(source, [
      'grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]',
      'grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]',
      "<RecentLotList\n          title={t('regular_summary.recent_title')}\n          description={t('regular_summary.recent_description')}\n          note={t('regular_summary.recent_note')}\n          items={recentLotItems}\n        />",
      'xl:items-stretch',
      'xl:grid-cols-[1fr_1fr]',
    ]);
  });

  it('keeps recent lot list reusable while allowing a compact rail mode', () => {
    const source = read(files.recentLots);

    expectContains(source, "import { cn } from '@/lib/utils';");
    expectContains(source, 'className?: string;');
    expectContains(source, 'compact?: boolean;');
    expectContains(source, 'compact = false');
    expectContains(source, "cn('space-y-5 border-t border-border pt-6', className)");
    expectContains(source, 'initialItemCount?: number;');
    expectContains(source, 'const visibleItems = initialItemCount');
    expectContains(source, "compact ? 'space-y-1.5' : 'space-y-2'");
    expectContains(source, "compact ? 'px-3 py-2' : 'px-4 py-3'");
    expectContains(source, "compact ? 'py-3 first:pt-0 last:pb-0' : 'py-4 first:pt-0 last:pb-0'");
    expectContains(source, "compact ? 'mt-3 gap-y-2.5' : 'mt-4 gap-y-3'");
    expectContains(
      source,
      'grid grid-cols-2 gap-x-6 text-sm md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4',
    );

    expectNoFragments(source, [
      '<section className="space-y-5 border-y border-border py-6">',
      '<p className="ui-body text-muted-foreground">{description}</p>',
      '<article key={item.key} className="py-4 first:pt-0 last:pb-0">',
      'mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4',
      'max-h-[42rem]',
      'overflow-y-auto',
    ]);
  });

  it('keeps ladder timeline below the shared recurring summary instead of adding another top rail', () => {
    const source = read(files.ladder);
    const sections = read(files.ladderSections);
    const table = read(files.ladderTable);

    expectContains(source, '<div className="ui-compact-flow">');
    expectContains(source, '<ResultSummaryHero');
    expectContains(source, '<MetricStrip');
    expectContains(source, '<LadderTimelineChartSection');
    expectContains(sections, '<ChartSection');
    expectContains(sections, '<SectionBlock');
    expectContains(table, '<TableDensityControls');

    expectNoFragments(source, [
      '<RecentLotList',
      'xl:max-h-[42rem]',
      'grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]',
      'return (<div className="space-y-6">',
      'surface-shell space-y-5 p-5',
    ]);
  });
});
