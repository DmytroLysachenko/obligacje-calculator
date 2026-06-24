import { describe, expect, it, vi } from 'vitest';

import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';

import {
  buildSharedPortfolioPageMetadata,
  getPublicSharedPortfolioPageData,
} from './shared-page-service';

vi.mock('@/lib/server/db/portfolio-schema-compat', () => ({
  ensurePortfolioSchemaCompat: vi.fn(),
}));

vi.mock('./repository', () => ({
  findPortfolioByShareId: vi.fn(async (shareId: string) => {
    if (shareId === 'missing') {
      return null;
    }

    if (shareId === 'private') {
      return {
        id: 'portfolio-private',
        name: 'Private Portfolio',
        description: 'Private description',
        isPublic: false,
      };
    }

    return {
      id: 'portfolio-public',
      name: 'Public Portfolio',
      description: 'Public description',
      isPublic: true,
    };
  }),
}));

describe('shared portfolio page service', () => {
  it('loads public shared portfolio data behind schema compatibility', async () => {
    const portfolio = await getPublicSharedPortfolioPageData('public');

    expect(ensurePortfolioSchemaCompat).toHaveBeenCalledOnce();
    expect(portfolio?.name).toBe('Public Portfolio');
  });

  it('filters missing and private shared portfolio records', async () => {
    await expect(getPublicSharedPortfolioPageData('missing')).resolves.toBeNull();
    await expect(getPublicSharedPortfolioPageData('private')).resolves.toBeNull();
  });

  it('builds fallback metadata when the public portfolio is missing', () => {
    expect(
      buildSharedPortfolioPageMetadata({
        portfolio: null,
        pageTitle: 'Shared Portfolio',
        pageDescription: 'Shared description',
        appTitle: 'Bonds Calculator',
      }),
    ).toEqual({
      title: 'Shared Portfolio | Bonds Calculator',
      description: 'Shared description',
    });
  });

  it('builds portfolio-specific metadata when a public portfolio exists', () => {
    expect(
      buildSharedPortfolioPageMetadata({
        portfolio: {
          id: 'portfolio-public',
          userId: 'user-1',
          name: 'Long Term Bonds',
          description: 'Real EDO lots',
          isPublic: true,
          shareId: 'share-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        pageTitle: 'Shared Portfolio',
        pageDescription: 'Shared description',
        appTitle: 'Bonds Calculator',
      }),
    ).toEqual({
      title: 'Long Term Bonds | Shared Portfolio',
      description: 'Real EDO lots',
    });
  });
});
