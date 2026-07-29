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
  it('keeps scenario metrics and export action in one responsive surface', () => {
    const source = read(files.panel);

    expectContains(source, '<ResultActionGrid');
    expectContains(
      source,
      'grid overflow-hidden border-y border-border bg-card 2xl:grid-cols-[minmax(0,1fr)_minmax(250px,0.3fr)]',
    );
    expectContains(
      source,
      'className="grid-cols-1 border-x-0 border-b-0 bg-muted/20 px-5 py-4 2xl:w-auto 2xl:border-l 2xl:border-t-0"',
    );

    expectNoFragments(source, [
      'className="border border-border bg-card p-3 lg:w-auto lg:border"',
      'border-y border-border bg-transparent px-0 py-3 lg:w-auto lg:border-x-0',
      'ui-action-row-end border-0 bg-transparent',
      'bg-card p-3',
      'rounded-lg border border-border bg-card',
    ]);
  });
});
