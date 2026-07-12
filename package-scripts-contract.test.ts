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
    expect(pkg.scripts['test:release']).toContain('lib/data/bond-series.test.ts');
    expect(pkg.scripts['test:release']).toContain('lib/seo/app-json-ld.test.ts');
    expect(pkg.scripts['test:release']).toContain('lib/sync/sync-engine.test.ts');
    expect(pkg.scripts['test:release']).toContain('lib/sync/sync-start-year.test.ts');
    expect(pkg.scripts['test:release']).toContain('app/api/production-readiness-contract.test.ts');
    expect(pkg.scripts['test:release']).toContain('app/api/operational-endpoints-contract.test.ts');
    expect(pkg.scripts['test:release']).toContain(
      'docs/ui/interactive-trigger-markup-contract.test.ts',
    );
    expect(pkg.scripts['test:release']).toContain('scripts/check-production-config.test.ts');
    expect(pkg.scripts['test:release']).toContain('scripts/verify-production.test.ts');
    expect(pkg.scripts['test:release']).toContain('tests/browser/browser-diagnostics.test.ts');
    expect(pkg.scripts['test:release']).toContain(
      'docs/technical/architecture/clean-code-contract.test.ts',
    );
    expect(pkg.scripts['test:browser']).toBe('playwright test tests/browser/app-smoke.spec.ts');
    expect(pkg.scripts['test:browser:ci']).toContain('tests/browser/app-smoke.spec.ts');
    expect(pkg.scripts['test:browser:ci']).toContain('tests/browser/web-vitals.spec.ts');
    expect(pkg.scripts['test:browser:ci']).toContain('--workers=1');
    expect(pkg.scripts['test:web-vitals']).toBe('playwright test tests/browser/web-vitals.spec.ts');
    expect(pkg.scripts['check:release']).toContain('pnpm check:types');
    expect(pkg.scripts['check:release']).toContain('pnpm lint');
    expect(pkg.scripts['check:release']).toContain('pnpm test:release');
    expect(pkg.scripts['check:release']).toContain('pnpm build');
    expect(pkg.scripts['check:local-env']).toBe('tsx scripts/check-local-env.ts');
    expect(pkg.scripts['check:prod-config']).toBe('tsx scripts/check-production-config.ts');
    expect(pkg.scripts['check:release']).not.toContain('check:prod-config');
    expect(pkg.scripts['smoke:local']).toBe('tsx scripts/smoke-local.ts');
    expect(pkg.scripts['ops:verify-prod']).toBe('tsx scripts/verify-production.ts');
    expect(pkg.scripts['ops:cloud-run-status']).toBe('tsx scripts/cloud-run-status.ts');
    expect(pkg.scripts['gcp:proxy']).toContain('gcloud run services proxy obligacje-calculator');

    const smokeLocal = readFileSync(join(process.cwd(), 'scripts/smoke-local.ts'), 'utf8');
    expect(smokeLocal).toContain('--check-content-type');
    expect(smokeLocal).toContain('--route');
    expect(smokeLocal).toContain('--retries');
  });

  it('starts browser tests through the standalone-aware Playwright launcher', () => {
    const playwrightConfig = readFileSync(join(process.cwd(), 'playwright.config.ts'), 'utf8');
    const launcher = readFileSync(
      join(process.cwd(), 'scripts/start-playwright-server.mjs'),
      'utf8',
    );

    expect(playwrightConfig).toContain('node scripts/start-playwright-server.mjs');
    expect(launcher).toContain("existsSync('.next/standalone/server.js')");
    expect(launcher).toContain("process.platform !== 'win32'");
    expect(launcher).toContain("cpSync('.next/static'");
    expect(launcher).toContain("require.resolve('next/dist/bin/next')");
    expect(launcher).toContain("PLAYWRIGHT_SMOKE: process.env.PLAYWRIGHT_SMOKE ?? '1'");
    expect(launcher).toContain(
      "NEXT_PUBLIC_PLAYWRIGHT_SMOKE: process.env.NEXT_PUBLIC_PLAYWRIGHT_SMOKE ?? '1'",
    );
  });

  it('keeps lint-staged full-repo checks isolated from staged filenames', () => {
    expect(pkg['lint-staged']['*.{ts,tsx}']).toEqual(
      expect.arrayContaining(['bash -c "pnpm exec tsc --noEmit"', 'bash -c "pnpm test:core"']),
    );
  });
});
