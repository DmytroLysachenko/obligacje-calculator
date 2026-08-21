import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchSyncJson, fetchSyncResponse, fetchSyncText } from './http-gateway';

describe('sync http gateway', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds default provider headers and returns parsed json', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSyncJson<{ ok: boolean }>('https://api.nbp.pl/data')).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          'User-Agent': 'obligacje-calculator/1.0',
        }),
      }),
    );
  });

  it('throws classified http errors by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('nope', {
          status: 503,
          statusText: 'Service Unavailable',
        }),
      ),
    );

    await expect(fetchSyncText('https://api.nbp.pl/down')).rejects.toThrow(
      'External fetch failed: 503 Service Unavailable for https://api.nbp.pl/down',
    );
  });

  it('can preserve fallback-style provider handling for bad statuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

    const response = await fetchSyncResponse('https://api.nbp.pl/missing', {
      throwOnHttpError: false,
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it('rejects non-HTTPS and non-allowlisted targets before fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSyncText('http://api.nbp.pl/data')).rejects.toThrow('not permitted');
    await expect(fetchSyncText('https://example.com/data')).rejects.toThrow('not permitted');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects redirects, unexpected JSON media types, and oversized responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('x'.repeat(20), {
          headers: { 'content-length': '20', 'content-type': 'text/plain' },
        }),
      ),
    );

    await expect(fetchSyncText('https://api.nbp.pl/data', { maxBytes: 10 })).rejects.toThrow(
      'byte limit',
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('not json', {
          headers: { 'content-type': 'text/plain' },
        }),
      ),
    );
    await expect(fetchSyncJson('https://api.nbp.pl/data')).rejects.toThrow('JSON content type');
  });
});
