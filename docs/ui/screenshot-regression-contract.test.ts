import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = process.cwd();

const files = {
  education: 'app/education/EducationClient.tsx',
  comparisonSharedBase: 'features/comparison-engine/components/ComparisonSharedBaseCard.tsx',
  economicHero: 'shared/components/reference/ReferenceDashboardHero.tsx',
  referenceChartFrame: 'shared/components/charts/ReferenceChartFrame.tsx',
  sidebarSettings: 'shared/components/chrome/SidebarSettingsUtility.tsx',
  economicLayoutContract: 'app/economic-data/economic-data-layout.test.ts',
  comparisonContract: 'features/comparison-engine/comparison-fairness-contract.test.ts',
  sidebarContract: 'shared/components/chrome/sidebar-refactor-contract.test.ts',
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

describe('screenshot regression contracts', () => {
  it('keeps education sections spaced after the flattened concept card pass', () => {
    const source = read(files.education);

    expectContains(source, 'space-y-12 pb-12 md:space-y-14');
    expectContains(source, 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3');
    expectContains(source, 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-4');
    expectContains(source, 'grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3');
    expectContains(source, 'border-t border-border py-4 transition-colors hover:border-foreground/30');
    expectContains(source, 'border-l-2 border-border pl-3 text-foreground');

    expectNoFragments(source, [
      'space-y-10 pb-12',
      'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3',
      'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4',
      'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3',
      'grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border',
      'bg-card p-4 transition-colors hover:bg-muted/25',
      'rounded-md bg-muted p-2 text-foreground',
    ]);
  });

  it('keeps maturity-mode controls from overflowing into comparison results', () => {
    const source = read(files.comparisonSharedBase);

    expectContains(source, 'className="h-auto min-w-0 justify-start overflow-hidden px-3 py-3 text-left"');
    expectContains(source, 'className="min-w-0 space-y-1 whitespace-normal"');
    expectContains(source, 'className="block max-w-full text-xs font-normal leading-5 opacity-80"');
    expectContains(source, 'aria-pressed={activeMaturityMode === mode}');
    expectContains(source, 'onClick={() => onUpdateSharedConfig(\'maturityMode\', mode)}');
    expectContains(source, 'border-l-2 border-border px-4 py-3');

    expectNoFragments(source, [
      'className="h-auto justify-start px-3 py-3 text-left"',
      '<span className="space-y-1">',
      'block text-xs font-normal leading-5 opacity-80',
      'border-l-2 border-border bg-muted/30 px-4 py-3',
      'flex items-center justify-between rounded-lg bg-muted/35 p-3',
    ]);
  });

  it('keeps economic reference metrics spaced instead of cell-like', () => {
    const source = read(files.economicHero);

    expectContains(source, 'grid gap-x-6 gap-y-4 border-y border-border py-3 sm:grid-cols-2 sm:border-y-0 sm:py-0');
    expectContains(source, 'border-t border-border pt-3 first:border-t-0 sm:first:border-t sm:first:pt-3');
    expectContains(source, 'text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground');
    expectContains(source, 'mt-1.5 text-base font-semibold tracking-tight text-foreground');

    expectNoFragments(source, [
      'grid border-y border-border sm:grid-cols-2 sm:border-y-0',
      'border-b border-border py-3 last:border-b-0',
      'sm:[&:nth-child(2)]:border-l',
      'sm:[&:nth-child(4)]:border-l',
      'overflow-hidden rounded',
      'bg-border',
    ]);
  });

  it('keeps fallback notices inline without outlined alert boxes', () => {
    const source = read(files.referenceChartFrame);

    expectContains(source, "import { Notice } from '@/shared/components/feedback/Notice';");
    expectContains(source, "tone={fallbackTone === 'warning' ? 'warning' : 'success'}");
    expectContains(source, 'compact className="border-0 bg-transparent px-0"');
    expectContains(source, 'inline-flex items-center gap-2 border-l-2 pl-3 text-xs font-semibold');
    expectContains(source, 'max-w-3xl text-sm leading-6 text-muted-foreground');

    expectNoFragments(source, [
      'compact className="border-t-0 bg-transparent px-0"',
      'rounded-lg border border-border bg-card',
      'overflow-hidden rounded-md border border-border',
      'shadow-none',
    ]);
  });

  it('keeps sidebar settings from feeling stuck together', () => {
    const source = read(files.sidebarSettings);

    expectContains(source, '<div className="space-y-3">');
    expectContains(source, 'mt-3.5 border-t border-border pt-3.5');
    expectContains(source, 'action={<LanguageSwitcher />}');
    expectContains(source, 'action={<ThemeToggle />}');

    expectNoFragments(source, [
      '<div className="space-y-0">',
      'mt-2.5 border-t border-border pt-2.5',
      '<>',
      '</>',
    ]);
  });

  it('keeps the screenshot fixes wired into focused source contracts', () => {
    const economicLayout = read(files.economicLayoutContract);
    const comparisonContract = read(files.comparisonContract);
    const sidebarContract = read(files.sidebarContract);

    expectContains(economicLayout, 'grid gap-x-6 gap-y-4 border-y');
    expectContains(economicLayout, 'border-0 bg-transparent px-0');
    expectContains(comparisonContract, 'min-w-0 space-y-1 whitespace-normal');
    expectContains(comparisonContract, 'block max-w-full text-xs font-normal leading-5 opacity-80');
    expectContains(sidebarContract, '<div className="space-y-3">');
    expectContains(sidebarContract, 'mt-3.5 border-t border-border pt-3.5');
  });
});
