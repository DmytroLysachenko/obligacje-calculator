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
  'features/notebook/components/WorkspaceStatusCard.tsx',
  'features/notebook/components/PortfolioWorkspaceCard.tsx',
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
    expect(sourceByPath.get('features/notebook/components/WorkspaceStatusCard.tsx')).toContain('border-l-2 border-border px-4 py-3');
    expect(sourceByPath.get('features/notebook/components/PortfolioWorkspaceCard.tsx')).toContain('border-l-2 border-border pl-3 pt-0.5');
    expect(sourceByPath.get('features/comparison-engine/components/bond-comparison/ComparisonResultsDashboard.tsx')).toContain("import { SectionBlock } from '@/shared/components/page/SectionBlock';");
  });
});
