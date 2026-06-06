import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = process.cwd();

const files = {
  workspaceCard: 'features/notebook/components/PortfolioWorkspaceCard.tsx',
  overviewHeader: 'features/notebook/components/portfolio-details/PortfolioOverviewHeader.tsx',
  sharedPortfolioPage: 'app/shared-portfolios/[shareId]/page.tsx',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expect(source).not.toContain(fragment);
  }
}

describe('portfolio notebook surface contract', () => {
  it('keeps portfolio workspace cards flat and action-focused', () => {
    const source = read(files.workspaceCard);

    expectContains(source, 'space-y-4 border-t border-border py-5');
    expectContains(source, 'border-l-2 border-border pl-3 pt-0.5 text-foreground');
    expectContains(source, 'text-[10px] font-semibold tracking-[0.08em] text-muted-foreground');
    expectContains(source, 'h-9 w-9 rounded-md text-muted-foreground hover:text-destructive');
    expectContains(source, 'grid gap-0 divide-y divide-dashed divide-border border-y border-border');

    expectNoFragments(source, [
      'rounded-md bg-muted p-2.5',
      'rounded-full border border-border bg-muted/40',
      'h-9 w-9 rounded-full',
      'rounded-lg border border-border bg-card',
    ]);
  });

  it('keeps portfolio overview header intro non-card and compact', () => {
    const source = read(files.overviewHeader);

    expectContains(source, '<p className="ui-meta font-semibold">');
    expectContains(source, "t('notebook.record_view')");
    expectContains(source, '<section className="space-y-6 border-t border-border py-6">');
    expectContains(source, '<div className="grid gap-4 md:grid-cols-3">');

    expectNoFragments(source, [
      'FolderOpen',
      'rounded-full border border-border bg-muted/40',
      'bg-card p-4',
      'shadow-sm',
    ]);
  });

  it('keeps shared portfolio notice divider-led and read-only clear', () => {
    const source = read(files.sharedPortfolioPage);

    expectContains(source, 'mb-8 flex items-center justify-between gap-4 border-y border-border py-4');
    expectContains(source, 'border-l-2 border-border pl-3 text-[10px] font-semibold uppercase tracking-widest text-foreground');
    expectContains(source, '<PortfolioDetails portfolio={portfolio} onBack={() => {}} />');

    expectNoFragments(source, [
      'rounded-lg border border-border bg-card p-4 shadow-none',
      'rounded-md border border-border bg-muted',
      'surface-shell',
    ]);
  });
});
