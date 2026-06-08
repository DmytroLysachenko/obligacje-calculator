import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  regularSummary: 'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  recentLots: 'shared/components/results/RecentLotList.tsx',
  ladder: 'features/ladder-strategy/components/LadderTimeline.tsx',
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

    expectContains(source, 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.75fr)] xl:items-start');
    expectContains(source, '<RecentLotList');
    expectContains(source, 'compact');
    expectContains(source, 'className="xl:max-h-[42rem] xl:overflow-y-auto xl:pr-2"');
    expectContains(source, '<SectionBlock');
    expectContains(source, '<ResponsiveTableSheet');
    expectContains(source, '<TableDensityControls');

    expectNoFragments(source, [
      'grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]',
      'grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]',
      '<RecentLotList\n          title={t(\'regular_summary.recent_title\')}\n          description={t(\'regular_summary.recent_description\')}\n          note={t(\'regular_summary.recent_note\')}\n          items={recentLotItems}\n        />',
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
    expectContains(source, "cn('space-y-5 border-y border-border py-6', className)");
    expectContains(source, "compact ? 'space-y-1.5' : 'space-y-2'");
    expectContains(source, "compact ? 'px-3 py-2' : 'px-4 py-3'");
    expectContains(source, "compact ? 'py-3 first:pt-0 last:pb-0' : 'py-4 first:pt-0 last:pb-0'");
    expectContains(source, "compact ? 'mt-3 gap-y-2.5' : 'mt-4 gap-y-3'");
    expectContains(source, 'grid grid-cols-2 gap-x-6 text-sm md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4');

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

    expectContains(source, 'return (<div className="space-y-8">');
    expectContains(source, '<ResultSummaryHero');
    expectContains(source, '<MetricStrip');
    expectContains(source, '<ChartSection');
    expectContains(source, '<SectionBlock');
    expectContains(source, '<TableDensityControls');

    expectNoFragments(source, [
      '<RecentLotList',
      'xl:max-h-[42rem]',
      'grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]',
      'return (<div className="space-y-6">',
      'surface-shell space-y-5 p-5',
    ]);
  });
});
