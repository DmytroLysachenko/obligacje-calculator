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
    expectUsesShared(sectionBlock, "variant?: SectionBlockVariant");
    expectAvoidsLocalPattern(landing, 'rounded-lg border border-border bg-card p-5 shadow-sm');
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
