import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

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
  'shared/components/chrome/SidebarNavigation.tsx',
  'shared/components/chrome/SidebarSyncSummary.tsx',
  'shared/components/chrome/SidebarUtilityGroup.tsx',
  'shared/components/chrome/SidebarWorkspaceUtility.tsx',
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
  'shared/components/results/ResultSummaryHero.tsx',
  'shared/components/results/ScenarioFactsBlock.tsx',
  'shared/components/results/SecondaryInsightAccordion.tsx',
] as const;

const filesWithAllowedSlateUtilities = new Set([
  'shared/components/chrome/Sidebar.tsx',
  'components/ui/switch.tsx',
  'components/ui/tooltip.tsx',
]);

const filesWithAllowedLargeRadius = new Set(['components/ui/tooltip.tsx']);

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

function expectNoFragments(relativePath: string, source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expect(source, `${relativePath} should not contain ${fragment}`).not.toContain(fragment);
  }
}

describe('shared shell design contracts', () => {
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
