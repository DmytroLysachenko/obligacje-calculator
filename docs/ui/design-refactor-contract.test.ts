import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

const productSurfaceFiles = [
  'app/economic-data/EconomicDataPageClient.tsx',
  'app/education/EducationClient.tsx',
  'app/shared-portfolios/[shareId]/page.tsx',
  'features/economic-data/components/InflationChart.tsx',
  'features/economic-data/components/NBPRateChart.tsx',
  'features/education/components/BondEducationCard.tsx',
  'features/notebook/components/NotebookContainer.tsx',
  'features/notebook/components/PortfolioWorkspaceCard.tsx',
  'features/notebook/components/WorkspaceActionStrip.tsx',
  'features/notebook/components/WorkspaceStatusCard.tsx',
  'features/notebook/components/portfolio-details/PortfolioAnalyticsTab.tsx',
  'features/notebook/components/portfolio-details/PortfolioLotsTab.tsx',
  'features/notebook/components/portfolio-details/PortfolioOverviewHeader.tsx',
  'shared/components/reference/ReferenceDashboardHero.tsx',
  'shared/components/reference/ReferenceGuideRail.tsx',
] as const;

const sharedShellFiles = [
  'components/ui/badge.tsx',
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/input.tsx',
  'components/ui/select.tsx',
  'components/ui/slider.tsx',
  'components/ui/switch.tsx',
  'components/ui/table.tsx',
  'components/ui/tabs.tsx',
  'components/ui/tooltip.tsx',
  'shared/components/chrome/LanguageSwitcher.tsx',
  'shared/components/chrome/Sidebar.tsx',
  'shared/components/chrome/SidebarSyncSummary.tsx',
  'shared/components/chrome/SidebarUtilityGroup.tsx',
  'shared/components/chrome/SidebarWorkspaceUtility.tsx',
  'shared/components/chrome/ThemeToggle.tsx',
  'shared/components/page/CalculatorPageShell.tsx',
  'shared/components/page/CalculatorSection.tsx',
  'shared/components/page/PageSuspenseFallback.tsx',
  'shared/components/page/SecondarySurfaceIntro.tsx',
  'shared/components/results/CalculationMetaPanel.tsx',
  'shared/components/results/MetricStrip.tsx',
  'shared/components/results/RateContextNote.tsx',
  'shared/components/results/ResponsiveTableSheet.tsx',
  'shared/components/results/ResultMetricCard.tsx',
  'shared/components/results/ResultSummaryHero.tsx',
  'shared/components/results/ScenarioFactsBlock.tsx',
  'shared/components/results/SecondaryInsightAccordion.tsx',
] as const;

const filesWithAllowedSlateUtilities = new Set([
  'shared/components/chrome/Sidebar.tsx',
  'components/ui/select.tsx',
  'components/ui/switch.tsx',
  'components/ui/tooltip.tsx',
]);

const filesWithAllowedLargeRadius = new Set([
  'components/ui/tooltip.tsx',
]);

function readSource(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function readMany(relativePaths: readonly string[]) {
  return relativePaths.map((relativePath) => ({
    relativePath,
    source: readSource(relativePath),
  }));
}

function expectNoFragments(
  relativePath: string,
  source: string,
  fragments: readonly string[],
) {
  for (const fragment of fragments) {
    expect(
      source,
      `${relativePath} should not contain ${fragment}`,
    ).not.toContain(fragment);
  }
}

describe('financial UI design refactor contracts', () => {
  it('keeps refactored product pages off oversized card radii and decorative shadows', () => {
    for (const { relativePath, source } of readMany(productSurfaceFiles)) {
      expectNoFragments(relativePath, source, [
        'rounded-[1.4rem]',
        'rounded-[1.5rem]',
        'rounded-[1.6rem]',
        'rounded-[1.7rem]',
        'rounded-[1.8rem]',
        'rounded-[1.9rem]',
        'rounded-[2rem]',
        'rounded-[2.2rem]',
        'rounded-2xl',
        'rounded-3xl',
        'shadow-2xl',
        'shadow-[0_',
        'bg-[linear-gradient',
      ]);
    }
  });

  it('keeps refactored product pages on shared tokens instead of slate color soup', () => {
    for (const { relativePath, source } of readMany(productSurfaceFiles)) {
      expectNoFragments(relativePath, source, [
        'border-slate-',
        'bg-slate-',
        'text-slate-',
        'hover:bg-slate-',
        'hover:border-slate-',
      ]);
    }
  });

  it('keeps semantic financial colors narrow and intentional', () => {
    const allowedFragments = [
      'text-success',
      'text-warning',
      'border-success',
      'border-warning',
      'bg-success',
      'bg-warning',
      'text-destructive',
      'border-destructive',
      'bg-destructive',
    ];

    for (const { relativePath, source } of readMany(productSurfaceFiles)) {
      const semanticColorLines = source
        .split('\n')
        .filter((line) =>
          /text-(emerald|green|blue|orange|amber|purple)|border-(emerald|green|blue|orange|amber|purple)|bg-(emerald|green|blue|orange|amber|purple)/.test(
            line,
          ),
        );

      for (const line of semanticColorLines) {
        expect(
          allowedFragments.some((fragment) => line.includes(fragment)),
          `${relativePath} has non-token financial color line: ${line.trim()}`,
        ).toBe(true);
      }
    }
  });

  it('keeps shared shell primitives within the compact radius system', () => {
    for (const { relativePath, source } of readMany(sharedShellFiles)) {
      if (filesWithAllowedLargeRadius.has(relativePath)) {
        continue;
      }

      expectNoFragments(relativePath, source, [
        'rounded-[1.35rem]',
        'rounded-[1.4rem]',
        'rounded-[1.5rem]',
        'rounded-[1.6rem]',
        'rounded-[1.7rem]',
        'rounded-[1.8rem]',
        'rounded-[1.9rem]',
        'rounded-[2rem]',
        'rounded-2xl',
        'rounded-3xl',
      ]);
    }
  });

  it('keeps shared shell primitives mostly tokenized', () => {
    for (const { relativePath, source } of readMany(sharedShellFiles)) {
      if (filesWithAllowedSlateUtilities.has(relativePath)) {
        continue;
      }

      expectNoFragments(relativePath, source, [
        'border-slate-',
        'bg-slate-',
        'text-slate-',
        'ring-slate-',
        'hover:bg-slate-',
        'hover:border-slate-',
      ]);
    }
  });
});
