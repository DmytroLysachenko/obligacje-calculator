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
  'shared/components/reference/ReferenceNoteCard.tsx',
] as const;

const referenceAndEducationRefinedFiles = [
  'app/economic-data/EconomicDataPageClient.tsx',
  'app/education/EducationClient.tsx',
  'features/education/components/BondEducationCard.tsx',
  'shared/components/reference/ReferenceDashboardHero.tsx',
  'shared/components/reference/ReferenceGuideRail.tsx',
  'shared/components/reference/ReferenceNoteCard.tsx',
] as const;

const singleCalculatorRefinedFiles = [
  'features/single-calculator/components/BondInputsForm.tsx',
  'features/single-calculator/components/BondCalculatorContainer.tsx',
  'features/single-calculator/components/BondChart.tsx',
  'features/single-calculator/components/BondResultsSummary.tsx',
  'features/single-calculator/components/BondTimeline.tsx',
  'features/single-calculator/components/CalculationAuditTrace.tsx',
  'features/single-calculator/components/SavedScenariosPanel.tsx',
  'features/single-calculator/components/ScenarioStarterPanel.tsx',
  'features/single-calculator/components/sections/BondConfigSection.tsx',
] as const;

const comparisonRefinedFiles = [
  'features/comparison-engine/components/BondComparisonContainer.tsx',
  'features/comparison-engine/components/ComparisonAssetBreakdown.tsx',
  'features/comparison-engine/components/MultiAssetComparisonChart.tsx',
  'features/comparison-engine/components/ComparisonContainer.tsx',
  'features/comparison-engine/components/ComparisonControls.tsx',
  'features/comparison-engine/components/ComparisonResultsPanel.tsx',
  'features/comparison-engine/components/ComparisonSharedBaseCard.tsx',
  'features/comparison-engine/components/ComparisonTable.tsx',
  'features/comparison-engine/components/ComparisonVerdict.tsx',
  'features/comparison-engine/components/MultiAssetComparisonContainer.tsx',
  'features/comparison-engine/components/ScenarioOverrideCard.tsx',
  'features/comparison-engine/components/bond-comparison/ComparisonConfigurationPanel.tsx',
  'features/comparison-engine/components/bond-comparison/ComparisonResultsDashboard.tsx',
] as const;

const recurringAndRetirementRefinedFiles = [
  'features/regular-investment/components/RegularInvestmentCalculatorContainer.tsx',
  'features/regular-investment/components/RegularInvestmentChart.tsx',
  'features/regular-investment/components/RegularInvestmentInputsForm.tsx',
  'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  'features/regular-investment/components/inputs/AdvancedSettingsSection.tsx',
  'features/regular-investment/components/inputs/BondSelectionSection.tsx',
  'features/regular-investment/components/inputs/SectionHeading.tsx',
  'features/retirement/components/RetirementInputsPanel.tsx',
  'features/retirement/components/RetirementPlannerContainer.tsx',
  'features/retirement/components/RetirementResultsOverview.tsx',
  'features/retirement/components/RetirementSupportList.tsx',
] as const;

const ladderRefinedFiles = [
  'features/ladder-strategy/components/LadderContainer.tsx',
  'features/ladder-strategy/components/LadderTimeline.tsx',
] as const;

const notebookRefinedFiles = [
  'features/notebook/components/NotebookContainer.tsx',
  'features/notebook/components/PortfolioWorkspaceCard.tsx',
  'features/notebook/components/WorkspaceStatusCard.tsx',
  'features/notebook/components/portfolio-details/PortfolioAnalyticsTab.tsx',
  'features/notebook/components/portfolio-details/PortfolioLotsTab.tsx',
  'features/notebook/components/portfolio-details/PortfolioOverviewHeader.tsx',
] as const;

const marketAssumptionRefinedFiles = [
  'shared/components/MarketAssumptionsForm.tsx',
  'shared/components/market-assumptions/AssumptionHistoryPopover.tsx',
  'shared/components/market-assumptions/AssumptionSemanticsNote.tsx',
  'shared/components/market-assumptions/MacroDefaultsSummary.tsx',
  'shared/components/market-assumptions/ProjectedRatePathEditor.tsx',
] as const;

const insightRefinedFiles = [
  'shared/components/insights/AdvisorTips.tsx',
  'shared/components/insights/MathDeepDive.tsx',
  'shared/components/insights/ReadingChecklist.tsx',
] as const;

const sideAndOperationalRefinedFiles = [
  'app/LandingDashboardClient.tsx',
  'app/admin/status/page.tsx',
  'app/error.tsx',
  'app/multi-asset/MultiAssetPageClient.tsx',
  'app/optimize/BondOptimizerClient.tsx',
  'app/recovery-lab/RecoveryLabPageClient.tsx',
  'features/admin/status/AdminStatusDashboard.tsx',
] as const;

const feedbackRefinedFiles = [
  'shared/components/feedback/ErrorBoundary.tsx',
  'shared/components/feedback/AppToast.tsx',
  'shared/components/feedback/ConfirmActionDialog.tsx',
  'shared/components/feedback/FeatureStatusNotice.tsx',
  'shared/components/feedback/RecalculateButton.tsx',
  'shared/components/feedback/ScenarioReadyPanel.tsx',
] as const;

const currentRefactorFiles = [
  ...referenceAndEducationRefinedFiles,
  ...singleCalculatorRefinedFiles,
  ...comparisonRefinedFiles,
  ...recurringAndRetirementRefinedFiles,
  ...ladderRefinedFiles,
  ...notebookRefinedFiles,
  ...marketAssumptionRefinedFiles,
  ...insightRefinedFiles,
  ...sideAndOperationalRefinedFiles,
  ...feedbackRefinedFiles,
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
  'shared/components/charts/ChartContainer.tsx',
  'shared/components/feedback/ErrorBoundary.tsx',
  'shared/components/page/CalculatorPageShell.tsx',
  'shared/components/page/CalculatorSection.tsx',
  'shared/components/page/PageSuspenseFallback.tsx',
  'shared/components/page/SecondarySurfaceIntro.tsx',
  'shared/components/reference/ReferenceDashboardHero.tsx',
  'shared/components/reference/ReferenceGuideRail.tsx',
  'shared/components/reference/ReferenceNoteCard.tsx',
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
  'components/ui/switch.tsx',
  'components/ui/tooltip.tsx',
]);

const filesWithAllowedLargeRadius = new Set([
  'components/ui/tooltip.tsx',
]);

const excessiveFragmentationFragments = [
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
  'border-2',
  'shadow-2xl',
  'shadow-[0_',
  'bg-[linear-gradient',
  'bg-[radial-gradient',
] as const;

const rawFinancialPaletteFragments = [
  'border-slate-',
  'bg-slate-',
  'text-slate-',
  'ring-slate-',
  'hover:bg-slate-',
  'hover:border-slate-',
  'border-amber-',
  'bg-amber-',
  'text-amber-',
  'border-blue-',
  'bg-blue-',
  'text-blue-',
  'border-emerald-',
  'bg-emerald-',
  'text-emerald-',
  'border-green-',
  'bg-green-',
  'text-green-',
  'border-orange-',
  'bg-orange-',
  'text-orange-',
  'border-purple-',
  'bg-purple-',
  'text-purple-',
  'border-red-',
  'bg-red-',
  'text-red-',
] as const;

const shadcnCardWrapperFragments = [
  "from '@/components/ui/card'",
  '<Card',
  '<CardContent',
  '<CardHeader',
  '<CardTitle',
  '<CardDescription',
] as const;

const translucentDecorativeFragments = [
  'bg-white/',
  'backdrop-blur',
  'blur-3xl',
] as const;

const compactRadiusFragments = [
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
] as const;

const slateUtilityFragments = [
  'border-slate-',
  'bg-slate-',
  'text-slate-',
  'ring-slate-',
  'hover:bg-slate-',
  'hover:border-slate-',
] as const;

function readSource(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), 'utf8').replace(/\r\n/g, '\n');
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
      expectNoFragments(relativePath, source, excessiveFragmentationFragments);
    }
  });

  it('keeps refactored product pages on shared tokens instead of slate color soup', () => {
    for (const { relativePath, source } of readMany(productSurfaceFiles)) {
      expectNoFragments(relativePath, source, slateUtilityFragments);
    }
  });

  it('keeps the current calculator refactor tranche free of heavy card language', () => {
    for (const { relativePath, source } of readMany(currentRefactorFiles)) {
      expectNoFragments(relativePath, source, excessiveFragmentationFragments);
    }
  });

  it('keeps the current calculator refactor tranche tokenized', () => {
    for (const { relativePath, source } of readMany(currentRefactorFiles)) {
      expectNoFragments(relativePath, source, rawFinancialPaletteFragments);
    }
  });

  it('keeps refactored analysis surfaces off translucent decorative shells', () => {
    const surfaceFiles = [
      ...referenceAndEducationRefinedFiles,
      ...singleCalculatorRefinedFiles,
      ...comparisonRefinedFiles,
      ...recurringAndRetirementRefinedFiles,
      ...ladderRefinedFiles,
      ...notebookRefinedFiles,
      ...marketAssumptionRefinedFiles,
      ...insightRefinedFiles,
      ...sideAndOperationalRefinedFiles,
    ] as const;

    for (const { relativePath, source } of readMany(surfaceFiles)) {
      expectNoFragments(relativePath, source, translucentDecorativeFragments);
    }
  });

  it('keeps refactored feature surfaces from importing shadcn card wrappers', () => {
    const flattenedFeatureFiles = [
      ...referenceAndEducationRefinedFiles,
      ...singleCalculatorRefinedFiles,
      ...comparisonRefinedFiles,
      ...ladderRefinedFiles,
      ...notebookRefinedFiles,
      ...marketAssumptionRefinedFiles,
      ...insightRefinedFiles,
      ...feedbackRefinedFiles,
      'shared/components/results/ResultSummaryHero.tsx',
    ] as const;

    for (const { relativePath, source } of readMany(flattenedFeatureFiles)) {
      expectNoFragments(relativePath, source, shadcnCardWrapperFragments);
    }
  });

  it('keeps feedback widgets compact and token-based', () => {
    for (const { relativePath, source } of readMany(feedbackRefinedFiles)) {
      expectNoFragments(relativePath, source, [
        'rounded-xl',
        'rounded-2xl',
        'rounded-3xl',
        'shadow-xl',
        'shadow-2xl',
        'backdrop-blur',
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

      expectNoFragments(relativePath, source, compactRadiusFragments);
    }
  });

  it('keeps shared shell primitives mostly tokenized', () => {
    for (const { relativePath, source } of readMany(sharedShellFiles)) {
      if (filesWithAllowedSlateUtilities.has(relativePath)) {
        continue;
      }

      expectNoFragments(relativePath, source, slateUtilityFragments);
    }
  });
});
