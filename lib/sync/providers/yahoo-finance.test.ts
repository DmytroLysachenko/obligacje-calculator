import { afterEach, describe, expect, it, vi } from 'vitest';

import { YahooFinanceSyncProvider } from './yahoo-finance';

describe('YahooFinanceSyncProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps monthly chart values to sync records', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      chart: {
        result: [{
          timestamp: [
            Date.parse('2024-07-01T00:00:00.000Z') / 1000,
            Date.parse('2024-08-01T00:00:00.000Z') / 1000,
          ],
          indicators: {
            adjclose: [{
              adjclose: [5522.3, 5648.4],
            }],
          },
        }],
        error: null,
      },
    })));

    const provider = new YahooFinanceSyncProvider({
      name: 'Yahoo Finance S&P 500',
      symbol: '^GSPC',
      seriesSlug: 'sp500',
    });

    await expect(provider.fetchData('2024-07-01', '2024-08-31')).resolves.toEqual([
      { seriesSlug: 'sp500', date: '2024-07-01', value: 5522.3 },
      { seriesSlug: 'sp500', date: '2024-08-01', value: 5648.4 },
    ]);
  });

  it('surfaces provider errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      chart: {
        result: null,
        error: {
          code: 'Not Found',
          description: 'No data found',
        },
      },
    })));

    const provider = new YahooFinanceSyncProvider({
      name: 'Yahoo Finance Gold Futures',
      symbol: 'GC=F',
      seriesSlug: 'gold-usd',
    });

    await expect(provider.fetchData('2024-07-01', '2024-08-31')).rejects.toThrow(
      'Yahoo Finance error for GC=F: No data found',
    );
  });
});
