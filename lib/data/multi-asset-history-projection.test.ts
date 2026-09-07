import { describe, expect, it } from 'vitest';

import { buildMultiAssetHistory } from './multi-asset-history-projection';

describe('buildMultiAssetHistory', () => {
  it('projects database points without depending on a cache or database adapter', () => {
    expect(
      buildMultiAssetHistory({
        sp500: [
          { date: '2024-01', value: 100 },
          { date: '2024-02', value: 110 },
        ],
        gold: [
          { date: '2024-01', value: 200 },
          { date: '2024-02', value: 210 },
        ],
        inflation: [{ date: '2024-02', value: 3.5 }],
        nbpRate: [{ date: '2024-02', value: 5.75 }],
      }),
    ).toMatchObject({
      source: 'database',
      coverageStart: '2024-02',
      coverageEnd: '2024-02',
      data: [expect.objectContaining({ sp500: 10, gold: 5, inflation: 3.5, nbpRate: 5.75 })],
    });
  });

  it('returns no projection when required series cannot support it', () => {
    expect(buildMultiAssetHistory({ sp500: [], gold: [], inflation: [], nbpRate: [] })).toBeNull();
  });
});
