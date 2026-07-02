import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  metricStrip: 'shared/components/results/MetricStrip.tsx',
  comparisonPanel: 'features/comparison-engine/components/ComparisonResultsPanel.tsx',
  comparisonModel: 'features/comparison-engine/lib/comparison-results-panel-model.ts',
  notebook: 'features/notebook/components/NotebookContainer.tsx',
  notebookModel: 'features/notebook/lib/notebook-workspace-model.ts',
} as const;

function read(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function normalizeWhitespace(source: string) {
  return source.replace(/\s+/g, ' ');
}

describe('metric unification contracts', () => {
  it('exposes shared metric item typing and layout overrides', () => {
    const source = read(paths.metricStrip);

    expect(source).toContain('export interface MetricStripItem');
    expect(source).toContain('className?: string;');
    expect(source).toContain("cn('border-y border-border', className)");
    expect(source).toContain('grid divide-y divide-border md:divide-y-0');
    expect(source).toContain(
      'space-y-2 py-4 md:border-l md:border-border md:px-4 md:first:border-l-0 md:first:pl-0',
    );
  });

  it('removes local metric renderers from comparison and notebook surfaces', () => {
    const comparison = read(paths.comparisonPanel);
    const comparisonModel = read(paths.comparisonModel);
    const notebook = read(paths.notebook);
    const notebookModel = read(paths.notebookModel);

    expect(comparison).toContain(
      "import { MetricStrip } from '@/shared/components/results/MetricStrip';",
    );
    expect(comparisonModel).toContain(
      "import { MetricStripItem } from '@/shared/components/results/MetricStrip';",
    );
    expect(comparisonModel).toContain('): MetricStripItem[]');
    expect(normalizeWhitespace(comparison)).toContain('<MetricStrip items={comparisonMetrics}');
    expect(comparison).not.toContain('function ActionMetric');

    expect(notebook).toContain(
      "import { MetricStrip } from '@/shared/components/results/MetricStrip';",
    );
    expect(notebookModel).toContain('buildNotebookStats');
    expect(normalizeWhitespace(notebook)).toContain('<MetricStrip items={notebookStats}');
    expect(notebook).not.toContain('function NotebookMiniStat');
  });
});
