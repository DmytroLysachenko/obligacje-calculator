import { describe, expect, it, vi } from 'vitest';
import { portfolioClient } from './portfolio-client';
import { apiGet, apiPost } from './api-client';

vi.mock('./api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

describe('portfolio client', () => {
  it('routes reads through the shared API client', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([]);

    await portfolioClient.listPortfolios();

    expect(apiGet).toHaveBeenCalledWith('/api/portfolio');
  });

  it('routes portfolio lot creation through the shared API client', async () => {
    const input = {
      portfolioId: 'p1',
      bondType: 'EDO',
      purchaseDate: '2026-06-01',
      amount: 10,
      isRebought: false,
      selectedSeriesId: null,
    };

    vi.mocked(apiPost).mockResolvedValueOnce({ id: 'lot1' });

    await portfolioClient.createLot(input);

    expect(apiPost).toHaveBeenCalledWith('/api/portfolio/lots', input);
  });
});
