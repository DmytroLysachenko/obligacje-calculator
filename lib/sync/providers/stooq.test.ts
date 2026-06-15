import { afterEach, describe, expect, it, vi } from 'vitest';

import { StooqSyncProvider } from './stooq';

describe('StooqSyncProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fails when Stooq returns browser verification HTML instead of CSV', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      '<!DOCTYPE html><html><body><noscript>This site requires JavaScript to verify your browser.</noscript><script>fetch("/__verify")</script></body></html>',
      {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      },
    ));
    vi.stubGlobal('fetch', fetchMock);

    const provider = new StooqSyncProvider();

    await expect(provider.fetchData('2024-07-01', '2026-06-01')).rejects.toThrow(
      'Stooq blocked CSV export for ^SPX',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails when Stooq returns access denied after verification', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('Access denied', {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const provider = new StooqSyncProvider();

    await expect(provider.fetchData('2024-07-01', '2026-06-01')).rejects.toThrow(
      'Stooq denied CSV export for ^SPX',
    );
  });
});
