import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('bond results help trigger', () => {
  it('forwards the sheet trigger props to its interactive button', () => {
    const source = readFileSync(
      join(root, 'features/single-calculator/components/BondResultsSummary.tsx'),
      'utf8',
    );

    expect(source).toContain('React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef');
    expect(source).toContain('{...props}');
  });
});
