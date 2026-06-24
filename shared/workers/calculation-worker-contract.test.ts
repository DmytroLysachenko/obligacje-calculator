import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('calculation worker contract', () => {
  it('keeps the browser worker as a remote transport instead of a parallel calculation engine', () => {
    const worker = read('shared/workers/calculation.worker.ts');
    const throttledHook = read('shared/hooks/useCalculationWorker.ts');

    expect(worker).not.toContain("from '@/features/bond-core/utils/calculations'");
    expect(worker).not.toContain("type === 'local'");
    expect(worker).not.toContain('isLocal: true');
    expect(throttledHook).not.toContain('canCalculateLocally');
    expect(throttledHook).toContain("'remote'");
  });
});
