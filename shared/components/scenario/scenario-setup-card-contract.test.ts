import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expect(source).not.toContain(fragment);
  }
}

describe('scenario setup card surface contract', () => {
  it('keeps scenario setup panels divider-led and reusable', () => {
    const source = read('shared/components/scenario/ScenarioSetupCard.tsx');

    expectContains(source, 'data-tone={tone}');
    expectContains(source, "'border-l-2 border-t px-4 py-4 sm:px-5'");
    expectContains(
      source,
      "'scenario-a': 'border-border data-[tone=scenario-a]:border-l-primary/60'",
    );
    expectContains(
      source,
      "'scenario-b': 'border-border data-[tone=scenario-b]:border-l-success/60'",
    );
    expectContains(source, 'border-b border-border pb-4');
    expectContains(source, 'border-t border-border pt-4');

    expectNoFragments(source, [
      'rounded-lg border border-l-2 bg-card',
      'shadow-sm',
      'rounded-2xl',
      'bg-muted/30',
    ]);
  });
});
