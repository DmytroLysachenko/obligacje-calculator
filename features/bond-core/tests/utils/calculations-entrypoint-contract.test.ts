import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('bond calculations entrypoint contract', () => {
  it('keeps calculations.ts as a compatibility entrypoint instead of an implementation sink', () => {
    const source = read('features/bond-core/utils/calculations.ts');

    expect(source.split('\n').length).toBeLessThanOrEqual(12);
    expect(source).toContain(
      "export { calculateBondInvestment } from './engine/single-bond-engine';",
    );
    expect(source).toContain(
      "export { calculateReverseBondInvestment } from './engine/reverse-bond-engine';",
    );
    expect(source).toContain(
      "export { calculateRegularInvestment } from './engine/regular-investment-engine';",
    );
    expect(source).not.toContain('for (let');
    expect(source).not.toContain('while (');
  });
});
