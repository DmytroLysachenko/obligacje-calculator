import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  hero: 'shared/components/reference/ReferenceDashboardHero.tsx',
  frame: 'shared/components/charts/ReferenceChartFrame.tsx',
  page: 'features/economic-data/components/EconomicDataPageClient.tsx',
  layoutContract: 'features/economic-data/tests/economic-data-layout.test.ts',
  healthContract: 'features/economic-data/tests/economic-data-health-contract.test.ts',
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

function expectTransparentCompactNotice(source: string) {
  expect(source).toMatch(
    /<Notice[\s\S]*?\bcompact\b[\s\S]*?className="border-0 bg-transparent px-0"/,
  );
}

describe('economic reference surface contracts', () => {
  it('keeps reference hero metrics spaced without cell-table density', () => {
    const source = read(files.hero);

    expectContains(
      source,
      'grid gap-x-8 gap-y-5 border-y border-border py-4 sm:grid-cols-2 sm:border-y-0 sm:py-1',
    );
    expectContains(source, 'border-l border-border/70 pl-4 first:border-l-0 first:pl-0');
    expectContains(source, 'sm:[&:nth-child(odd)]:border-l-0 sm:[&:nth-child(odd)]:pl-0');
    expectContains(
      source,
      'mt-1.5 text-base font-semibold leading-6 tracking-tight text-foreground',
    );

    expectNoFragments(source, [
      'grid gap-x-6 gap-y-4 border-y border-border py-3',
      'border-t border-border pt-3',
      'border-b border-border py-3',
      'sm:[&:nth-child(2)]:border-l',
      'sm:[&:nth-child(4)]:border-l',
      'overflow-hidden rounded-lg',
      'bg-border',
    ]);
  });

  it('keeps chart source metadata compact and scan-friendly', () => {
    const source = read(files.frame);

    expectContains(source, 'w-full min-w-0 space-y-4');
    expectContains(source, 'space-y-3 border-y border-border py-3');
    expectContains(source, 'flex flex-wrap items-start justify-between gap-x-6 gap-y-3');
    expectContains(source, '<dl className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 xl:grid-cols-4">');
    expectContains(source, 'border-l border-border/70 pl-3 first:border-l-0 first:pl-0');
    expectContains(source, 'mt-1 break-words text-sm font-medium leading-5 text-foreground');

    expectNoFragments(source, [
      'w-full min-w-0 space-y-5',
      'space-y-4 border-y border-border py-4',
      '<dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">',
      'mt-1 break-words text-sm font-medium text-foreground',
    ]);
  });

  it('keeps fallback status inline rather than alert-box-like', () => {
    const source = read(files.frame);

    expectTransparentCompactNotice(source);
    expectContains(source, 'flex flex-wrap items-start gap-x-4 gap-y-1.5');
    expectContains(source, 'inline-flex items-center gap-2 border-l-2 pl-3 text-xs font-semibold');
    expectContains(source, 'max-w-4xl text-sm leading-6 text-muted-foreground');
    expectContains(source, 'border-t border-border pt-3');

    expectNoFragments(source, [
      'compact className="border-t-0 bg-transparent px-0"',
      'gap-x-4 gap-y-2',
      'max-w-3xl text-sm leading-6 text-muted-foreground',
      'border-t border-border pt-4',
      'rounded-lg border border-border bg-card',
    ]);
  });

  it('keeps economic page using the shared reference surfaces', () => {
    const source = read(files.page);

    expectContains(source, '<ReferenceDashboardHero');
    expectContains(source, '<InflationChart period={period} />');
    expectContains(source, '<NBPRateChart period={period} />');
    expectContains(source, '<SectionBlock');
    expectContains(source, 'contentClassName="space-y-5"');
  });

  it('keeps focused economic contracts wired to the compact reference rules', () => {
    const layout = read(files.layoutContract);
    const health = read(files.healthContract);

    expectContains(layout, 'grid gap-x-8 gap-y-5 border-y');
    expectContains(layout, '<dl className="grid gap-x-8 gap-y-2.5');
    expectContains(layout, 'max-w-4xl text-sm leading-6 text-muted-foreground');
    expectContains(health, 'gap-x-4 gap-y-1.5');
    expectContains(health, 'max-w-4xl text-sm leading-6 text-muted-foreground');
  });
});
