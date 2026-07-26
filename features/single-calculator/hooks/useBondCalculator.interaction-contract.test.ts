import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'features/single-calculator/hooks/useBondCalculator.ts'),
  'utf8',
);

describe('single calculator interaction budget', () => {
  it('commits heavy result trees as a non-urgent transition', () => {
    expect(source).toContain('import { startTransition');
    expect(source).toContain('startTransition(() => {');
    expect(source).toContain('setEnvelope(nextEnvelope)');
    expect(source).toContain('setLastCommittedInputs(finalInputs)');
  });

  it('keeps field update callbacks stable for memoized form sections', () => {
    expect(source).toContain('const updateInput = useCallback');
    expect(source).toContain('const setBondType = useCallback');
  });
});
