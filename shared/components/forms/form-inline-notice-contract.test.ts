import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('form inline notice contract', () => {
  it('provides a shared compact form notice with optional action', () => {
    const source = read('shared/components/forms/FormInlineNotice.tsx');

    expect(source).toContain('export function FormInlineNotice');
    expect(source).toContain("tone?: 'neutral' | 'success' | 'warning';");
    expect(source).toContain('action?: React.ReactNode;');
    expect(source).toContain('border-l-2 px-4 py-3 text-sm leading-6');
  });

  it('keeps timing and advanced calculator helper boxes on the shared notice', () => {
    const singleTiming = read(
      'features/single-calculator/components/sections/BondTimingSection.tsx',
    );
    const regularTiming = read('features/regular-investment/components/inputs/TimingSection.tsx');
    const regularAdvanced = read(
      'features/regular-investment/components/inputs/AdvancedSettingsSection.tsx',
    );

    for (const source of [singleTiming, regularTiming, regularAdvanced]) {
      expect(source).toContain('FormInlineNotice');
    }

    expect(singleTiming).not.toContain('rounded-lg border border-border bg-muted/25 px-4 py-3');
    expect(regularTiming).not.toContain(
      'rounded-lg border border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground',
    );
  });
});
