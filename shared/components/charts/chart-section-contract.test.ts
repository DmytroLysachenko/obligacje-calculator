import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('chart section contract', () => {
  it('provides shared chart section framing with controls', () => {
    const source = read('shared/components/charts/ChartSection.tsx');

    expect(source).toContain('export function ChartSection');
    expect(source).toContain('controls?: React.ReactNode;');
    expect(source).toContain('border-t border-border py-5');
    expect(source).toContain('lg:max-w-[520px]');
  });

  it('keeps ladder maturity charts on the shared chart section', () => {
    const source = read('features/ladder-strategy/components/LadderTimeline.tsx');

    expect(source).toContain(
      "import { ChartSection } from '@/shared/components/charts/ChartSection';",
    );
    expect(source).toContain('<ChartSection');
    expect(source).not.toContain(
      "import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';",
    );
    expect(source).not.toContain('<section className="surface-shell space-y-7 p-5">');
  });
});
