import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  landing: 'app/LandingDashboardClient.tsx',
  education: 'app/education/EducationClient.tsx',
  toolCard: 'shared/components/page/ToolCard.tsx',
  educationCard: 'features/education/components/BondEducationCard.tsx',
  designSystem: 'docs/ui/design-system-adoption-v2-contract.test.ts',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
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

describe('entry surface contracts', () => {
  it('keeps landing trust and process surfaces divider-led', () => {
    const source = read(files.landing);

    expectContains(source, 'function HeroTrustStrip()');
    expectContains(
      source,
      'grid border-y border-border py-2 md:grid-cols-3 md:divide-x md:divide-border',
    );
    expectContains(
      source,
      'px-1 py-2 text-xs font-semibold leading-5 text-muted-foreground md:px-4',
    );
    expectContains(source, 'inline-flex items-center gap-2 border-l-2 border-border px-3 py-1');
    expectContains(source, 'border-l-2 border-border py-1 pl-4');
    expectContains(source, 'grid gap-5 lg:grid-cols-3');

    expectNoFragments(source, [
      'grid gap-px overflow-hidden rounded-lg border border-border bg-border',
      'bg-card px-4 py-3 text-xs font-semibold text-muted-foreground',
      'surface-chip text-xs font-semibold text-muted-foreground',
      'grid gap-4 lg:grid-cols-3',
    ]);
  });

  it('keeps shared home tool cards flat and icon-led', () => {
    const source = read(files.toolCard);

    expectContains(source, 'const iconAccentClass = {');
    expectContains(source, "primary: 'border-foreground text-foreground'");
    expectContains(source, "secondary: 'border-border text-foreground'");
    expectContains(source, "reference: 'border-primary/50 text-foreground'");
    expectContains(
      source,
      'group flex h-full flex-col gap-5 border-t border-border py-5 transition-colors',
    );
    expectContains(source, 'border-l-2 pl-3 pt-0.5');
    expectContains(source, 'iconAccentClass[emphasis]');
    expectContains(source, 'ui-section-title ui-safe-text');
    expectContains(source, 'ui-body ui-safe-text max-w-xl text-muted-foreground');

    expectNoFragments(source, [
      'rounded-md p-2.5',
      'bg-foreground text-background',
      'bg-muted text-foreground',
      'rounded-lg border border-border bg-card',
    ]);
  });

  it('keeps education concept cards airy instead of stitched cell grids', () => {
    const source = read(files.education);

    expectContains(source, 'space-y-14 pb-12 md:space-y-16');
    expectContains(source, 'grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3');
    expectContains(source, 'grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4');
    expectContains(source, 'grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3');
    expectContains(
      source,
      'border-t border-border py-5 transition-colors hover:border-foreground/30',
    );
    expectContains(source, 'border-l-2 border-border pl-3 text-foreground');
    expectContains(source, 'border-t border-border pt-3 font-mono text-[11px]');

    expectNoFragments(source, [
      'grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border',
      'space-y-12 pb-12 md:space-y-14',
      'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3',
      'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-4',
      'grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3',
      'border-t border-border py-4 transition-colors hover:border-foreground/30',
      'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3',
      'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4',
      'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3',
      'bg-card p-4 transition-colors hover:bg-muted/25',
      'rounded-md bg-muted p-2 text-foreground',
      'overflow-hidden rounded-lg',
    ]);
  });

  it('keeps education bond offer cards row-based and calculator-linked', () => {
    const source = read(files.educationCard);

    expectContains(
      source,
      'flex h-full min-h-[440px] flex-col border-t border-border py-6 transition-colors',
    );
    expectContains(source, 'flex flex-1 flex-col space-y-5 pt-5');
    expectContains(source, 'mt-auto space-y-5 pt-6');
    expectContains(source, 'surface-chip border-foreground text-foreground');
    expectContains(source, 'surface-chip text-foreground');
    expectContains(
      source,
      '<dl className="grid min-h-[132px] grid-cols-1 gap-x-4 divide-y divide-border border-y border-border',
    );
    expectContains(
      source,
      "import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';",
    );
    expectContains(source, '<FormInlineNotice');
    expectContains(source, 'inline-flex h-9 items-center gap-2 border-b border-foreground');
    expectContains(source, 'href="/single-calculator"');

    expectNoFragments(source, [
      '<Badge',
      'flex h-full flex-col border-t border-border py-5 transition-colors',
      'flex-1 space-y-4 pt-4',
      'mt-auto space-y-4 pt-1',
      'rounded-lg border border-border bg-card p-5 shadow-sm',
      'rounded-lg border border-border bg-muted/20 p-4',
      'rounded-md border border-warning/30 bg-warning/5',
      '?bondType=',
    ]);
  });

  it('keeps the entry-surface rules wired into the broader design contract', () => {
    const source = read(files.designSystem);

    expectContains(
      source,
      'grid border-y border-border py-2 md:grid-cols-3 md:divide-x md:divide-border',
    );
    expectContains(source, 'border-l-2 border-border py-1 pl-4');
    expectContains(source, 'grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3');
    expectContains(source, 'rounded-md bg-muted p-2 text-foreground');
  });
});
