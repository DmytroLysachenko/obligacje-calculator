import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('release scope contract', () => {
  it('keeps retained route smoke inventory aligned with the Cloud Run release scope', () => {
    const releasePlan = read('docs/plans/08_cloud_run_release_candidate_plan.md');
    const matrix = read('docs/product/26_trusted_and_experimental_feature_matrix.md');
    const appRoutes = [
      'app/education/page.tsx',
      'app/single-calculator/page.tsx',
      'app/compare/page.tsx',
      'app/regular-investment/page.tsx',
      'app/ladder/page.tsx',
      'app/notebook/page.tsx',
      'app/economic-data/page.tsx',
    ];

    for (const route of appRoutes) {
      expect(read(route)).toBeTruthy();
    }

    for (const routeName of [
      'education',
      'single calculator',
      'comparison',
      'regular investment',
      'ladder',
      'notebook',
      'economic data',
    ]) {
      expect(releasePlan).toContain(routeName);
    }

    expect(matrix).toContain('trusted core routes only');
  });

  it('keeps recovery-lab surfaces secondary to the retained release scope', () => {
    const recoveryLab = read('app/recovery-lab/RecoveryLabPageClient.tsx');
    const optimizer = read('app/optimize/page.tsx');
    const multiAsset = read('app/multi-asset/MultiAssetPageClient.tsx');
    const retirement = read('app/retirement/page.tsx');
    const matrix = read('docs/product/26_trusted_and_experimental_feature_matrix.md');

    expect(recoveryLab).toContain("status: 'experimental'");
    expect(optimizer).toContain('status="experimental"');
    expect(multiAsset).toContain('status="experimental"');
    expect(retirement).toContain('status="limited"');
    expect(matrix).toContain('recovery-lab emphasis');
    expect(matrix).toContain('optimizer, multi-asset, retirement');
  });
});
