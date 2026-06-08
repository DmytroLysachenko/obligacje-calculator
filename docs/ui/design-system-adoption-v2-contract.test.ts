import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectUsesShared(source: string, componentName: string) {
  expect(source).toContain(componentName);
}

function expectAvoidsLocalPattern(source: string, pattern: string) {
  expect(source).not.toContain(pattern);
}

describe('design system adoption v2 contract', () => {
  it('keeps selector usage centralized for calculator input surfaces', () => {
    const singleConfig = read('features/single-calculator/components/sections/BondConfigSection.tsx');
    const singleTimeline = read('features/single-calculator/components/BondTimeline.tsx');
    const regularBond = read('features/regular-investment/components/inputs/BondSelectionSection.tsx');
    const comparisonControls = read('features/comparison-engine/components/ComparisonControls.tsx');
    const comparisonShared = read('features/comparison-engine/components/ComparisonSharedBaseCard.tsx');
    const notebookStatus = read('features/notebook/components/WorkspaceStatusCard.tsx');
    const sidebarWorkspace = read('shared/components/chrome/SidebarWorkspaceUtility.tsx');
    const retirementInputs = read('features/retirement/components/RetirementInputsPanel.tsx');
    const optimizer = read('app/optimize/BondOptimizerClient.tsx');

    for (const source of [
      singleConfig,
      singleTimeline,
      regularBond,
      comparisonControls,
      comparisonShared,
      notebookStatus,
      sidebarWorkspace,
      retirementInputs,
      optimizer,
    ]) {
      expectUsesShared(source, 'FormSelect');
      expectAvoidsLocalPattern(source, "from '@/components/ui/select'");
    }

    expectUsesShared(read('shared/components/forms/FormSelect.tsx'), 'ui-focus-ring');
    expectUsesShared(read('shared/components/forms/FormSelect.tsx'), 'ui-truncate-flex');
  });

  it('keeps recurring card and section surfaces routed through shared primitives', () => {
    const education = read('app/education/EducationClient.tsx');
    const landing = read('app/LandingDashboardClient.tsx');
    const toolCard = read('shared/components/page/ToolCard.tsx');
    const sectionBlock = read('shared/components/page/SectionBlock.tsx');

    expectUsesShared(education, 'SectionBlock');
    expectUsesShared(landing, 'ToolCard');
    expectUsesShared(toolCard, 'ui-safe-text');
    expectUsesShared(toolCard, 'iconAccentClass');
    expectUsesShared(toolCard, 'border-l-2 pl-3 pt-0.5');
    expectUsesShared(sectionBlock, "variant?: SectionBlockVariant");
    expectAvoidsLocalPattern(landing, 'rounded-lg border border-border bg-card p-5 shadow-sm');
    expect(landing).toContain('grid border-y border-border py-2 md:grid-cols-3 md:divide-x md:divide-border');
    expect(landing).toContain('inline-flex items-center gap-2 border-l-2 border-border px-3 py-1');
    expect(landing).toContain('border-l-2 border-border py-1 pl-4');
    expectAvoidsLocalPattern(landing, 'grid gap-px overflow-hidden rounded-lg border border-border bg-border');
    expectAvoidsLocalPattern(landing, 'bg-card px-4 py-3 text-xs font-semibold text-muted-foreground');
    expectAvoidsLocalPattern(landing, 'surface-chip text-xs font-semibold text-muted-foreground');
    expect(education).toContain('space-y-14 pb-12 md:space-y-16');
    expect(education).toContain('grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3');
    expect(education).toContain('grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3');
    expect(education).toContain('border-t border-border py-5 transition-colors hover:border-foreground/30');
    expect(education).toContain('border-l-2 border-border pl-3 text-foreground');
    expectAvoidsLocalPattern(education, 'space-y-12 pb-12 md:space-y-14');
    expectAvoidsLocalPattern(education, 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3');
    expectAvoidsLocalPattern(education, 'grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3');
    expectAvoidsLocalPattern(education, 'border-t border-border py-4 transition-colors hover:border-foreground/30');
    expectAvoidsLocalPattern(education, 'grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border');
    expectAvoidsLocalPattern(education, 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3');
    expectAvoidsLocalPattern(education, 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3');
    expectAvoidsLocalPattern(education, 'bg-card p-4 transition-colors hover:bg-muted/25');
    expectAvoidsLocalPattern(education, 'rounded-md bg-muted p-2 text-foreground');
    expectAvoidsLocalPattern(toolCard, 'rounded-md p-2.5');
    expectAvoidsLocalPattern(toolCard, 'bg-foreground text-background');
    expectAvoidsLocalPattern(toolCard, 'bg-muted text-foreground');
  });

  it('keeps result actions and long result lists on shared components', () => {
    const resultHero = read('shared/components/results/ResultSummaryHero.tsx');
    const singleSummary = read('features/single-calculator/components/BondResultsSummary.tsx');
    const regularSummary = read('features/regular-investment/components/RegularInvestmentResultsSummary.tsx');
    const comparisonPanel = read('features/comparison-engine/components/ComparisonResultsPanel.tsx');

    expectUsesShared(resultHero, 'ResultActionGrid');
    expectUsesShared(singleSummary, "kind: 'pdf' as const");
    expectUsesShared(singleSummary, "kind: 'csv' as const");
    expectUsesShared(regularSummary, 'RecentLotList');
    expectUsesShared(comparisonPanel, 'ResultActionGrid');
    expectAvoidsLocalPattern(regularSummary, 'rounded-lg border border-border bg-card p-4');
  });

  it('keeps chart, sidebar, and accessibility cleanups protected', () => {
    const ladder = read('features/ladder-strategy/components/LadderTimeline.tsx');
    const sidebar = read('shared/components/chrome/SidebarSyncSummary.tsx');
    const globals = read('app/globals.css');
    const en = read('i18n/translations/en.json');

    expectUsesShared(ladder, 'ChartSection');
    expectUsesShared(sidebar, 'freshnessLabel');
    expectUsesShared(globals, '.ui-safe-text');
    expectUsesShared(globals, '.ui-focus-ring');
    expect(en).toContain('"caution": "Review"');
    expectAvoidsLocalPattern(en, '"caution": "Caution"');
  });
});
