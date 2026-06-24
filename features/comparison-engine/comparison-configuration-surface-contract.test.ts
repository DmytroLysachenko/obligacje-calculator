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

describe('comparison configuration surface contract', () => {
  it('keeps bond comparison configuration divider-led', () => {
    const source = read(
      'features/comparison-engine/components/bond-comparison/ComparisonConfigurationPanel.tsx',
    );

    expectContains(source, "import { SectionBlock } from '@/shared/components/page/SectionBlock';");
    expectContains(
      source,
      "import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';",
    );
    expectContains(source, '<SectionBlock');
    expectContains(source, 'variant="divided"');
    expectContains(source, 'contentClassName="space-y-5"');
    expectContains(source, 'border-l-2 border-border bg-muted/20 px-4 py-3');
    expectContains(source, '<FormInlineNotice');
    expectContains(source, 'border-l-2 border-warning bg-warning/5 px-4 py-4');
    expectContains(source, '<div className="border-t border-border py-4">');

    expectNoFragments(source, [
      'surface-shell space-y-5 p-5',
      'rounded-lg border border-border bg-card p-4',
      'rounded-lg border border-border bg-muted/25',
      'rounded-lg border border-warning/30 bg-warning/5',
    ]);
  });
});
