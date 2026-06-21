import { describe, expect, it } from 'vitest';
import {
  buildNotebookCapabilities,
  buildNotebookStats,
  getNotebookPortfolioCounts,
  NOTEBOOK_DEMO_LOTS,
  resolveNotebookPortfolioError,
} from './notebook-workspace-model';

describe('notebook workspace model', () => {
  it('maps portfolio storage errors to localized fallback copy', () => {
    const labels = {
      storageUnavailable: 'Storage unavailable',
      createError: 'Create failed',
    };

    expect(resolveNotebookPortfolioError({ code: 'portfolio_storage_unavailable' }, labels)).toBe('Storage unavailable');
    expect(resolveNotebookPortfolioError({ error: 'API failed' }, labels)).toBe('API failed');
    expect(resolveNotebookPortfolioError(null, labels)).toBe('Create failed');
  });

  it('keeps demo lot payloads stable', () => {
    expect(NOTEBOOK_DEMO_LOTS).toEqual([
      { bondType: 'EDO', amount: 50, purchaseDate: '2023-01-01' },
      { bondType: 'COI', amount: 100, purchaseDate: '2023-06-15' },
      { bondType: 'TOS', amount: 200, purchaseDate: '2024-01-10' },
    ]);
  });

  it('builds capability descriptors through the caller translation function', () => {
    const capabilities = buildNotebookCapabilities((key) => key);

    expect(capabilities.map((item) => item.id)).toEqual(['track', 'maturities', 'export', 'projection']);
    expect(capabilities[0].title).toBe('notebook.capabilities.track.title');
  });

  it('counts public and private portfolios for the metric strip', () => {
    const counts = getNotebookPortfolioCounts([
      { id: '1', isPublic: true },
      { id: '2', isPublic: false },
      { id: '3', isPublic: false },
    ] as never);

    expect(counts).toEqual({ totalCount: 3, publicCount: 1, privateCount: 2 });
    expect(buildNotebookStats({
      counts,
      labels: {
        portfolios: 'Portfolios',
        portfoliosDescription: 'All',
        publicLinks: 'Public',
        publicLinksDescription: 'Shared',
        privateDrafts: 'Private',
        privateDraftsDescription: 'Drafts',
      },
    }).map((item) => item.value)).toEqual(['3', '1', '2']);
  });
});
