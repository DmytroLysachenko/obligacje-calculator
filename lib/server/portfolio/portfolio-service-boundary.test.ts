import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('portfolio service boundary', () => {
  it('keeps route handlers pointed at command and query facades', () => {
    const route = read('app/api/portfolio/route.ts');
    const lotsRoute = read('app/api/portfolio/lots/route.ts');
    const shareRoute = read('app/api/portfolio/share/route.ts');
    const simulateRoute = read('app/api/portfolio/simulate/route.ts');

    expect(route).toContain("from '@/lib/server/portfolio/queries'");
    expect(route).toContain("from '@/lib/server/portfolio/commands'");
    expect(lotsRoute).toContain("from '@/lib/server/portfolio/queries'");
    expect(lotsRoute).toContain("from '@/lib/server/portfolio/commands'");
    expect(shareRoute).toContain("from '@/lib/server/portfolio/commands'");
    expect(simulateRoute).toContain("from '@/lib/server/portfolio/queries'");
  });

  it('keeps portfolio ownership reads available through the repository boundary', () => {
    const repository = read('lib/server/portfolio/repository.ts');
    const access = read('lib/server/portfolio/access.ts');

    expect(access).not.toContain("from '@/db'");
    expect(access).toContain("from '@/lib/server/portfolio/repository'");
    expect(access).toContain('findPortfolioByOwner(ownerId, portfolioId)');
    expect(access).toContain('findOwnedLotByOwner(ownerId, lotId)');
    expect(access).toContain('ensureGuestPortfolioOwner(ownerId)');
    expect(repository).toContain('export function findPortfolioByOwner');
    expect(repository).toContain('export async function findOwnedLotByOwner');
    expect(repository).toContain('export function ensureGuestPortfolioOwner');
    expect(repository).toContain('innerJoin(userPortfolios');
  });
});
