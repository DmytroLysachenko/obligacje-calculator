import { readFileSync } from 'node:fs';
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
});
