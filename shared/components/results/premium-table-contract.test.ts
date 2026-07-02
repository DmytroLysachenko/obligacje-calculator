import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  globals: 'app/globals.css',
  single: 'features/single-calculator/components/BondTimeline.tsx',
  singleDesktopRows: 'features/single-calculator/components/BondTimelineDesktopRows.tsx',
  singleMobileRows: 'features/single-calculator/components/BondTimelineMobileRows.tsx',
  regular: 'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  regularYearly: 'features/regular-investment/components/RegularInvestmentYearlyBucketsSection.tsx',
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

describe('premium financial table contracts', () => {
  it('defines a shared tabular-number utility for financial tables', () => {
    const source = read(files.globals);

    expectContains(source, '.financial-number');
    expectContains(source, 'font-variant-numeric: tabular-nums;');
  });

  it('keeps single calculator schedule table flat and sticky', () => {
    const source = read(files.singleDesktopRows);
    const mobile = read(files.singleMobileRows);

    expectContains(source, '<div className="hidden w-full border-y border-border lg:block">');
    expectContains(mobile, 'className="border-t border-border py-4 first:border-t-0"');
    expectContains(
      mobile,
      'className="mt-3 border-l-2 border-border px-3 text-xs leading-5 text-muted-foreground"',
    );
    expectContains(source, '<Table className="w-full table-fixed text-sm tabular-nums">');
    expectContains(source, '<TableRow className="h-12 hover:bg-transparent">');
    expectContains(source, 'sticky top-0 z-10 h-12 w-[11%] bg-background');
    expectContains(source, 'sticky top-0 z-10 h-12 w-[22%] bg-background');
    expectContains(source, 'sticky top-0 z-10 h-12 w-[12%] bg-background text-right');
    expectContains(source, 'h-14 border-b border-border transition-colors hover:bg-muted/25');
    expectContains(source, 'className="max-w-[28ch] space-y-1 pr-3"');
    expectContains(source, 'whitespace-normal break-words font-medium leading-5 text-foreground');
    expectContains(source, 'whitespace-normal break-words text-xs leading-5 text-muted-foreground');
    expectContains(source, 'financial-number py-4 align-top font-mono text-xs');

    expectNoFragments(source, [
      'hidden w-full overflow-hidden rounded-lg bg-card shadow-none',
      'rounded-lg bg-muted/30 p-4 shadow-none',
      '<Table className="table-fixed w-full">',
      '<Table className="w-full table-fixed text-sm">',
      '<TableRow className="bg-muted/35 hover:bg-muted/35">',
      'h-10 w-[11%] bg-muted/60',
      'hover:bg-muted/35',
      '<p className="line-clamp-2 text-xs leading-5 text-muted-foreground">',
    ]);
  });

  it('keeps regular investment yearly table sticky and numerically aligned', () => {
    const source = read(files.regularYearly);

    expectContains(source, '<SectionBlock');
    expectContains(source, 'className="border-y border-border py-6"');
    expectContains(source, '<div className="hidden border-y border-border lg:block">');
    expectContains(source, '<Table className="w-full table-fixed text-sm tabular-nums">');
    expectContains(source, 'sticky top-0 z-10 w-[16%] bg-background');
    expectContains(source, 'sticky top-0 z-10 w-[18%] bg-background text-right');
    expectContains(source, 'financial-number text-right');
    expectContains(source, 'financial-number text-right financial-positive');
    expectContains(source, 'financial-number text-right text-[var(--finance-warning)]');
    expectContains(source, 'financial-number text-right font-semibold');

    expectNoFragments(source, [
      '<TableHead className="w-[16%]">',
      '<div className="hidden overflow-hidden rounded-lg border border-border bg-card lg:block">',
      '<TableHead className="w-[18%] text-right">',
      '<TableCell className="text-right">{formatCurrency(bucket.invested)}</TableCell>',
      '<TableCell className="text-right financial-positive">',
      '<TableCell className="text-right text-[var(--finance-warning)]">',
    ]);
  });

  it('keeps regular investment recent lots capped beside the yearly table', () => {
    const regular = read(files.regular);
    const recentList = read('shared/components/results/RecentLotList.tsx');

    expectContains(
      regular,
      "import { MAX_RECENT_REGULAR_INVESTMENT_LOTS } from '@/features/regular-investment/constants/results';",
    );
    expectContains(
      regular,
      'buildRecentRegularInvestmentLots(results.lots, MAX_RECENT_REGULAR_INVESTMENT_LOTS)',
    );
    expectContains(
      regular,
      'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.75fr)] xl:items-start',
    );
    expectContains(regular, 'className="xl:max-h-[42rem] xl:overflow-y-auto xl:pr-2"');
    expectContains(regular, 'compact');
    expectContains(recentList, 'compact?: boolean;');
    expectContains(recentList, 'compact = false');
    expectContains(
      recentList,
      "compact ? 'py-3 first:pt-0 last:pb-0' : 'py-4 first:pt-0 last:pb-0'",
    );

    expectNoFragments(regular, [
      'grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]',
      'xl:items-stretch',
      "<RecentLotList\n          title={t('regular_summary.recent_title')}\n          description={t('regular_summary.recent_description')}\n          note={t('regular_summary.recent_note')}\n          items={recentLotItems}\n        />",
    ]);
    expectNoFragments(recentList, [
      '<section className="space-y-5 border-y border-border py-6">',
      'mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm',
    ]);
  });

  it('keeps ladder maturity table sticky and numerically aligned', () => {
    const source = [read(files.ladder), read(files.ladderSections), read(files.ladderTable)].join(
      '\n',
    );

    expectContains(
      source,
      "import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';",
    );
    expectContains(
      source,
      "import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';",
    );
    expectContains(source, '<SegmentedControl');
    expectContains(source, "import { SectionBlock } from '@/shared/components/page/SectionBlock';");
    expectContains(source, 'className="border-y border-border py-6"');
    expectContains(source, '<div className="hidden border-y border-border lg:block">');
    expectContains(source, '<Table className="w-full table-fixed text-sm tabular-nums">');
    expectContains(source, 'sticky top-0 z-10 w-[34%] bg-background');
    expectContains(source, 'sticky top-0 z-10 w-[24%] bg-background text-right');
    expectContains(source, 'financial-number text-right text-foreground');
    expectContains(source, 'financial-number text-right font-semibold text-foreground');
    expectContains(source, 'financial-number text-right text-muted-foreground');

    expectNoFragments(source, [
      '<TableHead className="w-[34%]">',
      '<div className="hidden overflow-hidden rounded-lg border border-border bg-card lg:block">',
      'surface-shell space-y-5 p-5',
      'surface-shell border-t-0 p-5',
      'rounded-md border border-border bg-muted/25 p-1',
      'rounded-lg border border-border bg-card p-4',
      'rounded-lg border border-border bg-muted/25 p-4',
      '<TableHead className="w-[24%] text-right">',
      '<TableCell className="text-right text-foreground">',
      '<TableCell className="text-right font-semibold text-foreground">',
      '<TableCell className="text-right text-muted-foreground">',
    ]);
  });

  it('keeps strategy table row controls available after table polish', () => {
    const regular = read(files.regularYearly);
    const ladder = read(files.ladderTable);
    const single = [read(files.single), read(files.singleDesktopRows)].join('\n');

    for (const source of [regular, ladder, single]) {
      expectContains(source, '<TableDensityControls');
      expectContains(source, 'visibleRows=');
      expectContains(source, "rowsShown: t('common.rows_shown')");
      expectContains(source, "rowsPerPage: t('common.rows_per_page')");
      expectContains(source, "all: t('common.all')");
    }
  });
});
