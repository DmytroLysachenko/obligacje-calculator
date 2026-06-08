import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  education: 'app/education/EducationClient.tsx',
  educationCard: 'features/education/components/BondEducationCard.tsx',
  sidebarUtilities: 'shared/components/chrome/SidebarUtilityGroup.tsx',
  sidebarSettings: 'shared/components/chrome/SidebarSettingsUtility.tsx',
  marketAssumptions: 'shared/components/MarketAssumptionsForm.tsx',
  regularSummary: 'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  recentLots: 'shared/components/results/RecentLotList.tsx',
  economicFrame: 'shared/components/charts/ReferenceChartFrame.tsx',
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

describe('final layout regression contracts', () => {
  it('keeps education page sections separated enough to scan', () => {
    const page = read(files.education);
    const card = read(files.educationCard);

    expectContains(page, 'space-y-14 pb-12 md:space-y-16');
    expectContains(page, 'grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3');
    expectContains(page, 'grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4');
    expectContains(page, 'grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3');
    expectContains(page, 'border-t border-border py-5 transition-colors hover:border-foreground/30');
    expectContains(card, 'flex h-full flex-col border-t border-border py-6 transition-colors hover:bg-muted/20');
    expectContains(card, 'flex-1 space-y-5 pt-5');
    expectContains(card, 'mt-auto space-y-4 pt-2');

    expectNoFragments(`${page}\n${card}`, [
      'space-y-12 pb-12 md:space-y-14',
      'grid grid-cols-1 gap-x-6 gap-y-8',
      'grid grid-cols-1 gap-x-6 gap-y-10',
      'border-t border-border py-4 transition-colors hover:border-foreground/30',
      'flex h-full flex-col border-t border-border py-5 transition-colors hover:bg-muted/20',
      'flex-1 space-y-4 pt-4',
      'mt-auto space-y-4 pt-1',
    ]);
  });

  it('keeps shared controls unified instead of page-local selector variants', () => {
    const source = read(files.marketAssumptions);

    expectContains(source, "import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';");
    expectContains(source, 'function ProjectionModeButtons');
    expectContains(source, 'function AssumptionHeader');
    expectContains(source, 'function CurrentAssumptionValue');
    expectContains(source, 'className="grid-cols-3"');
    expectContains(source, 'border-l border-border pl-4 text-right');

    expectNoFragments(source, [
      "import { Button } from '@/components/ui/button';",
      'inline-flex rounded-lg bg-muted/35 p-1',
      'grid grid-cols-3 gap-2',
      'rounded-lg bg-muted/35 px-3 py-1.5',
      'text-[32px]',
    ]);
  });

  it('keeps sidebar settings spaced by shared utility primitives', () => {
    const utilities = read(files.sidebarUtilities);
    const settings = read(files.sidebarSettings);

    expectContains(utilities, 'grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1');
    expectContains(utilities, 'export function SidebarUtilityStack');
    expectContains(utilities, 'divide-y divide-border');
    expectContains(settings, '<SidebarUtilityStack>');
    expectContains(settings, '<SidebarUtilityPanel flush>');

    expectNoFragments(`${utilities}\n${settings}`, [
      'border-t border-border py-2.5 first:border-t-0 first:pt-0',
      '<section className="space-y-1.5">',
      '<div className="border-y border-border py-0.5">',
      '<div className="space-y-3">',
      'mt-3.5 border-t border-border pt-3.5',
    ]);
  });

  it('keeps strategy result rails from delaying lower chart sections', () => {
    const regular = read(files.regularSummary);
    const lots = read(files.recentLots);

    expectContains(regular, 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.75fr)] xl:items-start');
    expectContains(regular, 'className="xl:max-h-[42rem] xl:overflow-y-auto xl:pr-2"');
    expectContains(regular, 'compact');
    expectContains(lots, 'compact?: boolean;');
    expectContains(lots, 'compact = false');

    expectNoFragments(`${regular}\n${lots}`, [
      'grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]',
      'grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]',
      '<section className="space-y-5 border-y border-border py-6">',
      'mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm',
    ]);
  });

  it('keeps economic fallback notices inline instead of boxed alerts', () => {
    const source = read(files.economicFrame);

    expectContains(source, 'compact className="border-0 bg-transparent px-0"');
    expectContains(source, 'flex flex-wrap items-start gap-x-4 gap-y-1.5');
    expectContains(source, 'inline-flex items-center gap-2 border-l-2 pl-3 text-xs font-semibold');
    expectContains(source, 'max-w-4xl text-sm leading-6 text-muted-foreground');

    expectNoFragments(source, [
      'rounded-lg border border-border bg-card',
      'compact className="border-t-0 bg-transparent px-0"',
      'gap-x-4 gap-y-2',
      'max-w-3xl text-sm leading-6 text-muted-foreground',
    ]);
  });
});
