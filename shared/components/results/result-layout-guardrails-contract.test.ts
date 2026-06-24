import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  actions: 'shared/components/results/ResultActionGrid.tsx',
  metrics: 'shared/components/results/MetricStrip.tsx',
  sheet: 'shared/components/results/ResponsiveTableSheet.tsx',
  hero: 'shared/components/results/ResultSummaryHero.tsx',
  single: 'features/single-calculator/components/BondTimeline.tsx',
  regular: 'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  ladder: 'features/ladder-strategy/components/LadderTimeline.tsx',
  comparison: 'features/comparison-engine/components/ComparisonTable.tsx',
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

describe('result layout guardrails', () => {
  it('keeps export/action grids responsive without text overflow', () => {
    const source = read(files.actions);

    expectContains(source, 'export const ResultActionGrid = React.memo(function ResultActionGrid');
    expectContains(
      source,
      'grid min-w-0 grid-cols-1 gap-2 border-t border-border bg-muted/30 p-4 sm:grid-cols-2',
    );
    expectContains(source, 'aria-label="Result actions"');
    expectContains(
      source,
      'h-10 min-w-0 justify-center gap-2 px-3 text-xs font-semibold ui-focus-ring',
    );
    expectContains(source, '<span className="shrink-0" aria-hidden={!action.icon}>');
    expectContains(source, '<span className="ui-truncate-flex">{action.label}</span>');
    expectContains(source, 'csv:');
    expectContains(source, 'pdf:');

    expectNoFragments(source, [
      'grid grid-cols-2 gap-2 border-t border-border bg-muted/30 p-4',
      '<span>{action.label}</span>',
      'w-[380px] grid-cols-2',
    ]);
  });

  it('keeps metric strips stable for long values and narrow columns', () => {
    const source = read(files.metrics);

    expectContains(source, 'export const MetricStrip = React.memo(function MetricStrip');
    expectContains(source, "columns = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'");
    expectContains(
      source,
      'className="min-w-0 space-y-2 py-4 md:border-l md:border-border md:px-4 md:first:border-l-0 md:first:pl-0"',
    );
    expectContains(
      source,
      "cn('financial-number ui-large-metric min-w-0 break-words text-foreground', item.tone)",
    );
    expectContains(source, '<p className="ui-body text-muted-foreground">{item.description}</p>');

    expectNoFragments(source, [
      'className="space-y-2 py-4 md:border-l',
      "cn('financial-number ui-large-metric text-foreground', item.tone)",
      'truncate',
      'overflow-hidden',
    ]);
  });

  it('keeps mobile table sheets scrollable and labelled', () => {
    const source = read(files.sheet);

    expectContains(source, 'sheetLabel?: string;');
    expectContains(source, 'aria-label={sheetLabel ?? triggerLabel}');
    expectContains(
      source,
      'className="h-auto w-full justify-between border-border bg-card px-4 py-4 text-left shadow-none"',
    );
    expectContains(source, '<span className="flex min-w-0 items-center gap-3">');
    expectContains(source, '<span className="min-w-0 space-y-1">');
    expectContains(source, 'block ui-truncate-flex text-sm font-semibold text-foreground');
    expectContains(source, 'block ui-truncate-flex text-xs text-muted-foreground');
    expectContains(source, 'className="flex h-[88vh] flex-col rounded-t-lg bg-card p-0"');
    expectContains(source, 'role="region"');
    expectContains(source, 'aria-labelledby={titleId}');
    expectContains(source, 'custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4');

    expectNoFragments(source, [
      'className="w-full justify-between border-border bg-card px-4 py-4 text-left shadow-none"',
      'className="h-[88vh] rounded-t-lg bg-card p-0"',
      'className="custom-scrollbar overflow-y-auto px-4 pb-8 pt-4"',
      '<span className="space-y-1">',
    ]);
  });

  it('keeps result summary heroes from squeezing actions or large financial values', () => {
    const source = read(files.hero);

    expectContains(
      source,
      'export const ResultSummaryHero = React.memo(function ResultSummaryHero',
    );
    expectContains(
      source,
      'className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"',
    );
    expectContains(source, 'className="min-w-0 max-w-4xl space-y-4 p-5 md:p-6"');
    expectContains(source, 'className="financial-number ui-primary-metric min-w-0 break-words"');
    expectContains(source, '<ResultActionGrid actions={actions} />');
    expectContains(source, 'lg:w-[280px] lg:shrink-0');

    expectNoFragments(source, [
      'className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"',
      'className="max-w-4xl space-y-4 p-5 md:p-6"',
      'className="financial-number ui-primary-metric"',
    ]);
  });

  it('keeps major result tables on mobile sheet plus desktop table pattern', () => {
    const sources = [
      read(files.single),
      read(files.regular),
      read(files.ladder),
      read(files.comparison),
    ];

    for (const source of sources) {
      expectContains(source, '<ResponsiveTableSheet');
      expectContains(source, '<Table className="w-full table-fixed');
      expectContains(source, 'tabular-nums');
    }

    expectContains(sources.join('\n'), '<TableDensityControls');
    expectContains(sources.join('\n'), 'financial-number');
    expectNoFragments(sources.join('\n'), [
      '<Table className="table-fixed w-full">',
      '<div className="hidden overflow-hidden rounded-lg border border-border bg-card',
      '<TableRow className="bg-muted/35 hover:bg-muted/35">',
    ]);
  });
});
