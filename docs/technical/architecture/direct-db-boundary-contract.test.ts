import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = process.cwd();
const codeRoots = ['app', 'features', 'shared', 'lib'];
const codeExtensions = new Set(['.ts', '.tsx']);

const approvedDirectDbFiles = new Set([
  'lib/data/bond-definition-data.ts',
  'lib/data/bond-series.ts',
  'lib/data/chart-series.ts',
  'lib/data/macro-market-data.ts',
  'lib/data/multi-asset-history.ts',
  'lib/inngest-functions.ts',
  'lib/server/admin/status.ts',
  'lib/server/bonds/offer-terms.ts',
  'lib/server/community/insights.ts',
  'lib/server/portfolio/access.ts',
  'lib/server/portfolio/repository.ts',
  'lib/server/settings/service.ts',
  'lib/server/shared-scenarios/service.ts',
  'lib/server/sync/run-history.ts',
  'lib/sync/macro-data-sync.ts',
  'lib/sync/seed-historical-offers.ts',
  'lib/sync/seed-production-bonds.ts',
  'lib/sync/seed-production-data.ts',
  'lib/sync/seed-series-runner.ts',
  'lib/sync/services/bond-offer-sync-service.ts',
  'lib/sync/services/provider-sync-service.ts',
]);

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function listCodeFiles(directory: string): string[] {
  const absoluteDirectory = join(root, directory);

  return readdirSync(absoluteDirectory).flatMap((entry) => {
    const absolutePath = join(absoluteDirectory, entry);
    const relativePath = relative(root, absolutePath).replace(/\\/g, '/');
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') {
        return [];
      }
      return listCodeFiles(relativePath);
    }

    const extension = relativePath.slice(relativePath.lastIndexOf('.'));
    return codeExtensions.has(extension) ? [relativePath] : [];
  });
}

describe('direct database boundary contract', () => {
  it('keeps direct database access limited to explicit data, repository, server, and sync boundaries', () => {
    const directDbFiles = codeRoots
      .flatMap(listCodeFiles)
      .filter((file) => /from ['"]@\/db['"]/.test(read(file)))
      .filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
      .sort();

    expect(directDbFiles).toEqual([...approvedDirectDbFiles].sort());
  });

  it('documents operational and local-build exceptions as intentional', () => {
    const cleanCodeContract = read('docs/technical/architecture/clean-code-contract.test.ts');
    const deploymentDocs = read('docs/technical/architecture/24_deployment_and_devops.md');

    expect(cleanCodeContract).toContain("'app/api/readiness/route.ts'");
    expect(cleanCodeContract).toContain("'shared/components/MacroAdjuster.tsx'");
    expect(cleanCodeContract).toContain("'shared/hooks/useQuerySync.ts'");
    expect(cleanCodeContract).toContain("'shared/workers/data-processor.worker.ts'");
    expect(cleanCodeContract).toContain("'lib/sync/seed-series.ts'");
    expect(deploymentDocs).toContain('Next standalone tracing may print a local copy warning');
  });
});
