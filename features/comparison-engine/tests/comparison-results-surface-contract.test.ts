import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
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
  it('keeps two-scenario export actions inline with results', () => {
    const source = read(files.panel);

    expectContains(source, '<ResultActionGrid');
    expectContains(source, 'className="ui-action-row-end border-0 bg-transparent px-0 py-3 lg:w-auto"');

    expectNoFragments(source, [
      'className="border border-border bg-card p-3 lg:w-auto lg:border"',
      'border-y border-border bg-transparent px-0 py-3 lg:w-auto lg:border-x-0',
      'bg-card p-3',
      'rounded-lg border border-border bg-card',
    ]);
  });
});
