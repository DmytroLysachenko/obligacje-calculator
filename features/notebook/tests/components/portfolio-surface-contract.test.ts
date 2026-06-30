import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  workspaceCard: 'features/notebook/components/PortfolioWorkspaceCard.tsx',
  details: 'features/notebook/components/PortfolioDetails.tsx',
  overviewHeader: 'features/notebook/components/portfolio-details/PortfolioOverviewHeader.tsx',
  lotsTab: 'features/notebook/components/portfolio-details/PortfolioLotsTab.tsx',
  lotsTabSections: 'features/notebook/components/portfolio-details/PortfolioLotsTabSections.tsx',
  analyticsTab: 'features/notebook/components/portfolio-details/PortfolioAnalyticsTab.tsx',
  sharedPortfolioPage: 'app/shared-portfolios/[shareId]/page.tsx',
  sharedPageService: 'lib/server/portfolio/shared-page-service.ts',
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
    expectContains(
      source,
      'grid gap-0 divide-y divide-dashed divide-border border-y border-border',
    );

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

  it('keeps portfolio detail tabs divider-led instead of boxed', () => {
    const source = read(files.details);

    expectContains(source, 'const detailTabTriggerClassName =');
    expectContains(source, 'rounded-none border-b-2 border-transparent px-3.5 py-2');
    expectContains(
      source,
      'data-[state=active]:border-foreground data-[state=active]:bg-transparent',
    );
    expectContains(
      source,
      '<TabsList className="mb-5 h-auto w-full justify-start gap-3 border-b border-border bg-transparent p-0 md:w-fit">',
    );
    expectContains(source, 'className={detailTabTriggerClassName}');

    expectNoFragments(source, [
      '<TabsList className="mb-4 grid w-full grid-cols-2 md:w-fit">',
      'data-[state=active]:bg-background',
      'rounded-lg border border-border bg-card',
    ]);
  });

  it('keeps portfolio lots and liquidity windows row-based', () => {
    const source = read(files.lotsTab);
    const sections = read(files.lotsTabSections);

    expectContains(
      source,
      "import {\n  PortfolioLiquidityPanel,\n  PortfolioLotsTableSection,\n  type PortfolioMaturityItem,\n} from './PortfolioLotsTabSections';",
    );
    expectContains(
      sections,
      "import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';",
    );
    expectContains(
      sections,
      "import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';",
    );
    expectContains(sections, 'const maturityWindowOptions = [30, 90, 180] as const;');
    expectContains(sections, '<Table className="w-full table-fixed text-sm tabular-nums">');
    expectContains(sections, 'sticky top-0 z-10 h-12 w-[14%] bg-background');
    expectContains(
      sections,
      'className="h-14 border-b border-border transition-colors hover:bg-muted/25"',
    );
    expectContains(sections, '<SegmentedControl');
    expectContains(sections, 'className="grid-cols-3"');
    expectContains(sections, '<div className="border-y border-border py-4">');
    expectContains(sections, 'financial-number mt-2 text-2xl font-semibold text-foreground');
    expectContains(sections, '<FormInlineNotice');

    expectNoFragments(`${source}\n${sections}`, [
      'rounded-lg bg-muted/30 px-4 py-4',
      'odd:bg-muted/20 hover:bg-muted/40',
      '<Table>',
      'className="h-9"',
      '[30, 90, 180].map',
      'variant={maturityWindowDays === days ?',
    ]);
  });

  it('keeps portfolio analytics explanatory copy inline', () => {
    const source = read(files.analyticsTab);

    expectContains(
      source,
      "import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';",
    );
    expectContains(source, '<section className="border-t border-border py-5">');
    expectContains(source, '<FormInlineNotice');
    expectContains(source, 'tone="success"');
    expectContains(source, '<TrendingUp className="h-4 w-4 text-success" />');

    expectNoFragments(source, [
      '<div className="border-t border-border py-5">',
      '<div className="flex items-start gap-3">',
      '<TrendingUp className="mt-0.5 h-5 w-5 text-success" />',
    ]);
  });

  it('keeps shared portfolio notice divider-led and read-only clear', () => {
    const source = read(files.sharedPortfolioPage);
    const service = read(files.sharedPageService);

    expectContains(source, 'getPublicSharedPortfolioPageData');
    expectContains(source, 'buildSharedPortfolioPageMetadata');
    expectContains(
      source,
      'mb-8 flex items-center justify-between gap-4 border-y border-border py-4',
    );
    expectContains(
      source,
      'border-l-2 border-border pl-3 text-[10px] font-semibold uppercase tracking-widest text-foreground',
    );
    expectContains(source, '<PortfolioDetails portfolio={portfolio} onBack={() => {}} />');
    expectContains(service, 'export async function getPublicSharedPortfolioPageData');
    expectContains(service, 'await ensurePortfolioSchemaCompat();');
    expectContains(service, 'export function buildSharedPortfolioPageMetadata');

    expectNoFragments(source, [
      'ensurePortfolioSchemaCompat',
      'getPublicSharedPortfolioByShareId',
      'rounded-lg border border-border bg-card p-4 shadow-none',
      'rounded-md border border-border bg-muted',
      'surface-shell',
    ]);
  });
});
