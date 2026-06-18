import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('ladder state boundary contract', () => {
  it('uses shared calculator state helpers for stable input updates', () => {
    const source = read('features/ladder-strategy/hooks/useLadder.ts');

    expect(source).toContain("from '@/shared/lib/calculator-state'");
    expect(source).toContain('preserveStableState(previous, next)');
    expect(source).not.toContain('JSON.stringify(previous) === JSON.stringify(next)');
  });
});
