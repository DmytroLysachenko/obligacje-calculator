import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('product readiness documentation contract', () => {
  it('keeps roadmap and feature matrix aligned with Cloud Run trusted-core release scope', () => {
    const roadmap = read('docs/plans/00_roadmap.md');
    const matrix = read('docs/product/26_trusted_and_experimental_feature_matrix.md');

    expect(roadmap).toContain('Current release-candidate preparation');
    expect(roadmap).toContain('first Google Cloud Run deployment');
    expect(matrix).toContain('first Google Cloud Run deployment');
    expect(matrix).toContain('trusted core routes only');
  });

  it('keeps completed refactor execution plans out of the active plan index', () => {
    const activePlans = readdirSync(join(root, 'docs/plans')).sort();
    const archiveIndex = read('docs/archive/plans/index.md');
    const docsIndex = read('docs/index.md');
    const archivedPlanFiles = [
      '02_full_app_refactor_and_recovery_plan.md',
      '03_manual_regression_and_release_candidate_checklist.md',
      '04_post_refactor_polish_and_hardening_plan.md',
      '05_retained_route_regression_execution_log.md',
      '06_future_backend_migration_to_dotnet_plan.md',
      '07_product_quality_verification_tranche.md',
    ];

    expect(existsSync(join(root, 'docs/archive/plans'))).toBe(true);
    expect(activePlans).toEqual([
      '00_roadmap.md',
      '01_longterm_product_foundation_plan.md',
      '08_cloud_run_release_candidate_plan.md',
    ]);

    for (const archivedPlanFile of archivedPlanFiles) {
      expect(archiveIndex).toContain(archivedPlanFile);
      expect(docsIndex).not.toContain(`./plans/${archivedPlanFile}`);
    }
  });
});
