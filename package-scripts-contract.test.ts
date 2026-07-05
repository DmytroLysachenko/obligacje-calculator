import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  'lint-staged': Record<string, string[]>;
  scripts: Record<string, string>;
};

describe('package scripts contract', () => {
  it('keeps a single release-check command for Cloud Run promotion gates', () => {
    expect(pkg.scripts['check:types']).toBe('tsc --noEmit');
    expect(pkg.scripts['test:release']).toContain('features/bond-core');
    expect(pkg.scripts['test:release']).toContain('app/api/production-readiness-contract.test.ts');
    expect(pkg.scripts['test:release']).toContain('app/api/operational-endpoints-contract.test.ts');
    expect(pkg.scripts['test:release']).toContain(
      'docs/technical/architecture/clean-code-contract.test.ts',
    );
    expect(pkg.scripts['check:release']).toContain('pnpm check:types');
    expect(pkg.scripts['check:release']).toContain('pnpm lint');
    expect(pkg.scripts['check:release']).toContain('pnpm test:release');
    expect(pkg.scripts['check:release']).toContain('pnpm build');
    expect(pkg.scripts['check:prod-config']).toBe('tsx scripts/check-production-config.ts');
    expect(pkg.scripts['check:release']).not.toContain('check:prod-config');
  });

  it('keeps lint-staged full-repo checks isolated from staged filenames', () => {
    expect(pkg['lint-staged']['*.{ts,tsx}']).toEqual(
      expect.arrayContaining(['bash -c "pnpm exec tsc --noEmit"', 'bash -c "pnpm test:core"']),
    );
  });
});
