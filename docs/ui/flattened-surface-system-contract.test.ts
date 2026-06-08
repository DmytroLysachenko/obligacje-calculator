import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = process.cwd();

const flattenedSurfaceFiles = [
  'shared/components/reference/ReferenceDashboardHero.tsx',
  'shared/components/reference/ReferenceNoteCard.tsx',
  'shared/components/charts/ChartSection.tsx',
  'shared/components/results/MetricStrip.tsx',
  'shared/components/results/ScenarioFactsBlock.tsx',
  'shared/components/results/CalculationMetaPanel.tsx',
  'shared/components/results/FinancialInsightStrip.tsx',
  'shared/components/scenario/ScenarioSetupCard.tsx',
  'shared/components/feedback/ScenarioReadyPanel.tsx',
  'shared/components/feedback/FeatureStatusNotice.tsx',
  'shared/components/page/SecondarySurfaceIntro.tsx',
  'shared/components/forms/AdvancedAssumptionsDisclosure.tsx',
  'shared/components/forms/SegmentedControl.tsx',
  'features/single-calculator/components/BondInputsForm.tsx',
  'features/single-calculator/components/sections/BondDisplaySection.tsx',
  'features/regular-investment/components/inputs/AdvancedSettingsSection.tsx',
  'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  'features/ladder-strategy/components/LadderTimeline.tsx',
  'shared/components/results/RecentLotList.tsx',
  'shared/components/page/ToolCard.tsx',
  'app/LandingDashboardClient.tsx',
  'app/education/EducationClient.tsx',
  'features/notebook/components/WorkspaceStatusCard.tsx',
  'features/notebook/components/PortfolioWorkspaceCard.tsx',
  'features/notebook/components/PortfolioDetails.tsx',
  'features/notebook/components/portfolio-details/PortfolioLotsTab.tsx',
  'features/notebook/components/portfolio-details/PortfolioAnalyticsTab.tsx',
  'features/comparison-engine/components/ScenarioOverrideCard.tsx',
  'features/comparison-engine/components/bond-comparison/ComparisonConfigurationPanel.tsx',
  'features/comparison-engine/components/bond-comparison/ComparisonResultsDashboard.tsx',
] as const;

const oldSurfaceFragments = [
  'surface-shell space-y-5 p-5',
  'surface-shell space-y-6 p-5',
  'rounded-lg border border-border bg-card p-5 shadow-sm',
  'rounded-lg border border-border bg-card p-5',
  'rounded-lg border border-border bg-card p-4',
  'rounded-lg border border-border bg-muted/20',
  'rounded-md border border-border bg-card p-4',
  'rounded-md border border-border bg-card p-1',
  'rounded-md border border-border bg-muted/25 p-1',
  'rounded-md border border-border bg-muted/35 p-4',
  'rounded-md border bg-card px-4 py-3',
  'rounded-full border border-border bg-muted/40',
  'overflow-hidden rounded-lg border border-border bg-border shadow-sm',
] as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('flattened shared surface system contract', () => {
  it('keeps migrated shared surfaces free from old card-shell fragments', () => {
    for (const relativePath of flattenedSurfaceFiles) {
      const source = read(relativePath);

      for (const fragment of oldSurfaceFragments) {
        expect(source, `${relativePath} should not contain ${fragment}`).not.toContain(fragment);
      }
    }
  });

  it('keeps migrated shared surfaces anchored by dividers or left-border emphasis', () => {
    const sourceByPath = new Map(
      flattenedSurfaceFiles.map((relativePath) => [relativePath, read(relativePath)]),
    );

    expect(sourceByPath.get('shared/components/reference/ReferenceDashboardHero.tsx')).toContain('border-y border-border py-5');
    expect(sourceByPath.get('shared/components/reference/ReferenceNoteCard.tsx')).toContain('border-l-2 px-4 py-3');
    expect(sourceByPath.get('shared/components/charts/ChartSection.tsx')).toContain('border-l-2 border-border pl-3');
    expect(sourceByPath.get('shared/components/results/MetricStrip.tsx')).toContain("cn('border-y border-border', className)");
    expect(sourceByPath.get('shared/components/results/ScenarioFactsBlock.tsx')).toContain('border-y border-border py-4');
    expect(sourceByPath.get('shared/components/results/CalculationMetaPanel.tsx')).toContain('border-y border-border py-3');
    expect(sourceByPath.get('shared/components/results/FinancialInsightStrip.tsx')).toContain('border-l-2 px-4 py-3');
    expect(sourceByPath.get('shared/components/scenario/ScenarioSetupCard.tsx')).toContain('border-l-2 border-t px-4 py-4');
    expect(sourceByPath.get('shared/components/feedback/ScenarioReadyPanel.tsx')).toContain('space-y-6 border-t border-border py-6');
    expect(sourceByPath.get('shared/components/feedback/ScenarioReadyPanel.tsx')).toContain('border-l-2 border-border bg-muted/20 px-4 py-3');
    expect(sourceByPath.get('shared/components/feedback/FeatureStatusNotice.tsx')).toContain('border-l-2 px-4 py-4');
    expect(sourceByPath.get('shared/components/feedback/FeatureStatusNotice.tsx')).toContain('text-[10px] font-semibold uppercase tracking-[0.08em]');
    expect(sourceByPath.get('shared/components/page/SecondarySurfaceIntro.tsx')).toContain('space-y-4 border-y py-5 md:py-6');
    expect(sourceByPath.get('shared/components/page/SecondarySurfaceIntro.tsx')).toContain('<div className="ui-meta font-semibold">');
    expect(sourceByPath.get('shared/components/forms/AdvancedAssumptionsDisclosure.tsx')).toContain('border-l-2 border-border pl-3 pt-0.5');
    expect(sourceByPath.get('shared/components/forms/SegmentedControl.tsx')).toContain('grid grid-cols-2 gap-1 border-y border-border py-1');
    expect(sourceByPath.get('features/single-calculator/components/BondInputsForm.tsx')).toContain("import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';");
    expect(sourceByPath.get('features/single-calculator/components/sections/BondDisplaySection.tsx')).toContain("import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';");
    expect(sourceByPath.get('features/single-calculator/components/sections/BondDisplaySection.tsx')).toContain("import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';");
    expect(sourceByPath.get('features/regular-investment/components/inputs/AdvancedSettingsSection.tsx')).toContain("import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';");
    expect(sourceByPath.get('features/regular-investment/components/RegularInvestmentResultsSummary.tsx')).toContain("import { SectionBlock } from '@/shared/components/page/SectionBlock';");
    expect(sourceByPath.get('features/regular-investment/components/RegularInvestmentResultsSummary.tsx')).toContain('<div className="hidden border-y border-border lg:block">');
    expect(sourceByPath.get('features/ladder-strategy/components/LadderTimeline.tsx')).toContain("import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';");
    expect(sourceByPath.get('features/ladder-strategy/components/LadderTimeline.tsx')).toContain("import { SectionBlock } from '@/shared/components/page/SectionBlock';");
    expect(sourceByPath.get('features/ladder-strategy/components/LadderTimeline.tsx')).toContain('<div className="hidden border-y border-border lg:block">');
    expect(sourceByPath.get('shared/components/results/RecentLotList.tsx')).toContain('space-y-5 border-y border-border py-6');
    expect(sourceByPath.get('shared/components/page/ToolCard.tsx')).toContain('border-l-2 pl-3 pt-0.5');
    expect(sourceByPath.get('app/LandingDashboardClient.tsx')).toContain('grid border-y border-border py-2 md:grid-cols-3 md:divide-x md:divide-border');
    expect(sourceByPath.get('app/education/EducationClient.tsx')).toContain('border-t border-border py-4 transition-colors hover:border-foreground/30');
    expect(sourceByPath.get('features/notebook/components/WorkspaceStatusCard.tsx')).toContain('border-l-2 border-border px-4 py-3');
    expect(sourceByPath.get('features/notebook/components/PortfolioWorkspaceCard.tsx')).toContain('border-l-2 border-border pl-3 pt-0.5');
    expect(sourceByPath.get('features/notebook/components/PortfolioDetails.tsx')).toContain('rounded-none border-b-2 border-transparent px-3.5 py-2');
    expect(sourceByPath.get('features/notebook/components/PortfolioDetails.tsx')).toContain('border-b border-border bg-transparent p-0');
    expect(sourceByPath.get('features/notebook/components/portfolio-details/PortfolioLotsTab.tsx')).toContain("import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';");
    expect(sourceByPath.get('features/notebook/components/portfolio-details/PortfolioLotsTab.tsx')).toContain('financial-number mt-2 text-2xl font-semibold text-foreground');
    expect(sourceByPath.get('features/notebook/components/portfolio-details/PortfolioAnalyticsTab.tsx')).toContain("import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';");
    expect(sourceByPath.get('features/notebook/components/portfolio-details/PortfolioAnalyticsTab.tsx')).toContain('<FormInlineNotice');
    expect(sourceByPath.get('features/comparison-engine/components/ScenarioOverrideCard.tsx')).toContain("import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';");
    expect(sourceByPath.get('features/comparison-engine/components/bond-comparison/ComparisonConfigurationPanel.tsx')).toContain("import { SectionBlock } from '@/shared/components/page/SectionBlock';");
    expect(sourceByPath.get('features/comparison-engine/components/bond-comparison/ComparisonResultsDashboard.tsx')).toContain("import { SectionBlock } from '@/shared/components/page/SectionBlock';");
  });
});
