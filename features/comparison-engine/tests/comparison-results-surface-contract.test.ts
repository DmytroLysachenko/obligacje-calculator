import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  dashboard: 'features/comparison-engine/components/bond-comparison/ComparisonResultsDashboard.tsx',
  dashboardParts:
    'features/comparison-engine/components/bond-comparison/ComparisonResultsDashboardParts.tsx',
  panel: 'features/comparison-engine/components/ComparisonResultsPanel.tsx',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expect(source).not.toContain(fragment);
  }
}

describe('comparison results surface contracts', () => {
  it('uses the shared section block for bond comparison results', () => {
    const source = read(files.dashboard);

    expectContains(source, "import { SectionBlock } from '@/shared/components/page/SectionBlock';");
    expectContains(source, '<SectionBlock');
    expectContains(source, 'contentClassName="space-y-5"');
    expectContains(source, '<ChartSupportNote');
    expectContains(source, '<ChartContainer height={420}>');

    expectNoFragments(source, [
      'function SectionBlock(',
      'surface-shell space-y-5 p-5',
      '<section className="surface-shell',
    ]);
  });

  it('keeps comparison cards and empty steps divider-led', () => {
    const source = read(files.dashboardParts);

    expectContains(source, '<article className="space-y-5 border-t border-border py-5">');
    expectContains(source, '<section className="space-y-6 border-t border-border py-6">');
    expectContains(source, '<div className="border-t border-border py-4">');
    expectContains(source, 'border-l-2 border-success bg-success/5 px-4 py-3');

    expectNoFragments(source, [
      'space-y-5 rounded-lg border border-border bg-card p-5',
      'rounded-lg border border-border bg-card p-4',
      'rounded-md border border-success/30 bg-success/5',
      'surface-shell space-y-6 p-5 md:p-6',
    ]);
  });

  it('keeps two-scenario export actions inline with results', () => {
    const source = read(files.panel);

    expectContains(source, '<ResultActionGrid');
    expectContains(source, 'className="border-0 bg-transparent px-0 py-3 lg:w-auto"');

    expectNoFragments(source, [
      'className="border border-border bg-card p-3 lg:w-auto lg:border"',
      'border-y border-border bg-transparent px-0 py-3 lg:w-auto lg:border-x-0',
      'bg-card p-3',
      'rounded-lg border border-border bg-card',
    ]);
  });
});
