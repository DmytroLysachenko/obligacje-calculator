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
    const admittedRoutes = [
      'app/education/page.tsx',
      'app/single-calculator/page.tsx',
      'app/economic-data/page.tsx',
    ];

    for (const route of admittedRoutes) {
      expect(read(route)).toBeTruthy();
    }

    for (const routeName of ['education', 'single calculator', 'economic data']) {
      expect(releasePlan).toContain(routeName);
    }

    expect(matrix).toContain('admitted trusted-core routes only');
    expect(releasePlan).toContain('remain private-preview');
  });

  it('keeps recovery-lab surfaces secondary to the retained release scope', () => {
    const recoveryLab = read('features/recovery-lab/components/RecoveryLabPageClient.tsx');
    const optimizer = read('app/optimize/page.tsx');
    const multiAsset = read('features/comparison-engine/components/MultiAssetPageClient.tsx');
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
