import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const codeRoots = ['app', 'features', 'shared', 'lib'];
const codeExtensions = new Set(['.ts', '.tsx']);

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

function listMatchingFiles(pattern: RegExp) {
  return codeRoots
    .flatMap(listCodeFiles)
    .filter((file) => pattern.test(read(file)));
}

function forbiddenPortfolioServiceImports(source: string) {
  const serviceImports = source.matchAll(
    /import\s+\{([^}]+)\}\s+from ['"]@\/lib\/server\/portfolio\/service['"]/g,
  );

  return Array.from(serviceImports)
    .flatMap((match) => (match[1] ?? '').split(','))
    .map((name) => name.trim())
    .filter((name) => name && name !== 'PortfolioServiceError');
}

describe('layer boundary contract', () => {
  it('keeps calculation endpoint literals centralized in the shared endpoint registry', () => {
    const endpointLiteral = /['"`]\/api\/calculate\/(?:single|regular|compare|optimize|retirement)['"`]/;
    const matches = listMatchingFiles(endpointLiteral)
      .filter((file) => file !== 'shared/lib/calculation-endpoints.ts')
      .filter((file) => file !== 'shared/lib/calculation-endpoints.test.ts');

    expect(matches).toEqual([]);
  });

  it('keeps calculation UI clients pointed at endpoint abstractions', () => {
    const clients = [
      'features/single-calculator/hooks/useBondCalculator.ts',
      'features/regular-investment/hooks/useRegularInvestmentCalculator.ts',
      'features/comparison-engine/hooks/useComparison.ts',
      'features/comparison-engine/components/BondComparisonContainer.tsx',
      'features/ladder-strategy/hooks/useLadder.ts',
      'features/retirement/components/RetirementPlannerContainer.tsx',
      'app/optimize/BondOptimizerClient.tsx',
    ];

    for (const client of clients) {
      const source = read(client);

      expect(source, client).toContain("from '@/shared/lib/calculation-endpoints'");
      expect(source, client).not.toMatch(/\/api\/calculate\/(?:single|regular|compare|optimize|retirement)/);
    }
  });

  it('keeps migrated portfolio UI clients behind the portfolio gateway', () => {
    const clients = [
      'shared/hooks/useWorkspacePortfolios.ts',
      'shared/hooks/usePortfolioAccess.ts',
      'features/single-calculator/components/BondCalculatorContainer.tsx',
    ];

    for (const client of clients) {
      const source = read(client);

      expect(source, client).toContain("from '@/shared/lib/portfolio-client'");
      expect(source, client).not.toMatch(/fetch\([^)]*\/api\/portfolio/);
    }
  });

  it('keeps portfolio route controllers on command and query facades', () => {
    const routeFiles = [
      'app/api/portfolio/route.ts',
      'app/api/portfolio/lots/route.ts',
      'app/api/portfolio/lots/[id]/route.ts',
      'app/api/portfolio/lots/save/route.ts',
      'app/api/portfolio/share/route.ts',
      'app/api/portfolio/simulate/route.ts',
      'app/api/portfolio/import/route.ts',
      'app/api/portfolio/export/route.ts',
      'app/api/portfolio/summary/route.ts',
    ];

    for (const routeFile of routeFiles) {
      const source = read(routeFile);

      expect(forbiddenPortfolioServiceImports(source), routeFile).toEqual([]);
      expect(source, routeFile).toMatch(/from ['"]@\/lib\/server\/portfolio\/(?:commands|queries)['"]/);
    }
  });

  it('keeps simple API controllers on shared response helpers', () => {
    const routeFiles = [
      'app/api/bond-definitions/route.ts',
      'app/api/calculation-defaults/route.ts',
      'app/api/charts/inflation/route.ts',
      'app/api/charts/nbp-rate/route.ts',
    ];

    for (const routeFile of routeFiles) {
      const source = read(routeFile);

      expect(source, routeFile).toContain("from '@/lib/server/http/responses'");
      expect(source, routeFile).not.toContain('NextResponse.json');
    }
  });
});
