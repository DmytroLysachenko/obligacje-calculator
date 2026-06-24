import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  metricStrip: 'shared/components/results/MetricStrip.tsx',
  comparisonPanel: 'features/comparison-engine/components/ComparisonResultsPanel.tsx',
  notebook: 'features/notebook/components/NotebookContainer.tsx',
} as const;

function read(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
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
    const notebook = read(paths.notebook);

    expect(comparison).toContain(
      "import { MetricStrip, MetricStripItem } from '@/shared/components/results/MetricStrip';",
    );
    expect(comparison).toContain(
      'const comparisonMetrics = React.useMemo<MetricStripItem[]>(() => [',
    );
    expect(comparison).toContain('<MetricStrip items={comparisonMetrics}');
    expect(comparison).not.toContain('function ActionMetric');

    expect(notebook).toContain(
      "import { MetricStrip, MetricStripItem } from '@/shared/components/results/MetricStrip';",
    );
    expect(notebook).toContain('const notebookStats: MetricStripItem[] = [');
    expect(notebook).toContain('<MetricStrip items={notebookStats}');
    expect(notebook).not.toContain('function NotebookMiniStat');
  });
});
