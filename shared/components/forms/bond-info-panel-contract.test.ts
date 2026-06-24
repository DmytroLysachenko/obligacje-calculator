import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('bond info panel contract', () => {
  it('provides one reusable bond description panel for calculator forms', () => {
    const source = read('shared/components/forms/BondInfoPanel.tsx');

    expect(source).toContain('export function BondInfoPanel');
    expect(source).toContain('border-l-2 border-border bg-muted/20');
    expect(source).toContain('badges?: BondInfoPanelBadge[];');
    expect(source).toContain('notice?: React.ReactNode;');
  });

  it('keeps single and recurring calculator bond notes on the shared panel', () => {
    const single = read('features/single-calculator/components/sections/BondConfigSection.tsx');
    const regular = read('features/regular-investment/components/inputs/BondSelectionSection.tsx');

    expect(single).toContain(
      "import { BondInfoPanel } from '@/shared/components/forms/BondInfoPanel';",
    );
    expect(regular).toContain(
      "import { BondInfoPanel } from '@/shared/components/forms/BondInfoPanel';",
    );
    expect(single).toContain('<BondInfoPanel');
    expect(regular).toContain('<BondInfoPanel');
    expect(single).not.toContain('rounded-lg border border-border bg-muted/25 px-4 py-3 text-sm');
    expect(regular).not.toContain('rounded-lg border border-border bg-muted/25 px-4 py-3 text-sm');
  });
});
