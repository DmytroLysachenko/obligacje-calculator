import { describe, expect, it } from 'vitest';
import { UserPortfolio } from '@/db/schema';
import {
  removePortfolioFromNotebookState,
  resolveSelectedPortfolioId,
  sortPortfoliosByFreshness,
  upsertPortfolioInNotebookState,
} from './notebook-state';

function portfolio(
  id: string,
  updatedAt: string,
  overrides: Partial<UserPortfolio> = {},
): UserPortfolio {
  return {
    id,
    userId: `owner-${id}`,
    name: `Portfolio ${id}`,
    description: null,
    createdAt: new Date(updatedAt),
    updatedAt: new Date(updatedAt),
    shareId: `share-${id}`,
    isPublic: false,
    ...overrides,
  };
}

describe('notebook state helpers', () => {
  it('sorts portfolios by newest update first', () => {
    const sorted = sortPortfoliosByFreshness([
      portfolio('older', '2026-05-10T00:00:00.000Z'),
      portfolio('newer', '2026-05-14T00:00:00.000Z'),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['newer', 'older']);
  });

  it('inserts new portfolios and keeps freshness ordering', () => {
    const current = [
      portfolio('b', '2026-05-10T00:00:00.000Z'),
      portfolio('a', '2026-05-09T00:00:00.000Z'),
    ];

    const next = upsertPortfolioInNotebookState(
      current,
      portfolio('c', '2026-05-15T00:00:00.000Z'),
    );

    expect(next.map((item) => item.id)).toEqual(['c', 'b', 'a']);
  });

  it('updates existing portfolio and resorts by newest freshness', () => {
    const current = [
      portfolio('b', '2026-05-10T00:00:00.000Z'),
      portfolio('a', '2026-05-09T00:00:00.000Z'),
    ];

    const next = upsertPortfolioInNotebookState(
      current,
      portfolio('a', '2026-05-16T00:00:00.000Z', { isPublic: true }),
    );

    expect(next[0].id).toBe('a');
    expect(next[0].isPublic).toBe(true);
  });

  it('removes deleted portfolios cleanly', () => {
    const current = [
      portfolio('a', '2026-05-09T00:00:00.000Z'),
      portfolio('b', '2026-05-10T00:00:00.000Z'),
    ];

    const next = removePortfolioFromNotebookState(current, 'a');

    expect(next.map((item) => item.id)).toEqual(['b']);
  });

  it('clears selected portfolio when it no longer exists', () => {
    const current = [portfolio('a', '2026-05-09T00:00:00.000Z')];

    expect(resolveSelectedPortfolioId('a', current)).toBe('a');
    expect(resolveSelectedPortfolioId('missing', current)).toBeNull();
    expect(resolveSelectedPortfolioId(null, current)).toBeNull();
  });
});
