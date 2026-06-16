import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('package scripts contract', () => {
  it('keeps a single release-check command for Cloud Run promotion gates', () => {
    expect(pkg.scripts['check:types']).toBe('tsc --noEmit');
    expect(pkg.scripts['check:release']).toContain('pnpm check:types');
    expect(pkg.scripts['check:release']).toContain('pnpm lint');
    expect(pkg.scripts['check:release']).toContain('pnpm test:ci');
    expect(pkg.scripts['check:release']).toContain('pnpm build');
  });
});
