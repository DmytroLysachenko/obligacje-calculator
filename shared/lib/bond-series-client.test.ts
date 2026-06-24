import { describe, expect, it, vi } from 'vitest';

import { BondType } from '@/features/bond-core/types';

import { apiGet } from './api-client';
import { bondSeriesClient } from './bond-series-client';

vi.mock('./api-client', () => ({
  apiGet: vi.fn(),
}));

describe('bond series client', () => {
  it('routes symbol-filtered reads through the shared API client', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([]);

    await bondSeriesClient.listBySymbol(BondType.EDO);

    expect(apiGet).toHaveBeenCalledWith('/api/calculate/bond-series?symbol=EDO');
  });
});
