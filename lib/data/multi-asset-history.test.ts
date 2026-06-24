import { describe, expect, it } from 'vitest';
import { HISTORICAL_RETURNS } from '@/features/bond-core/constants/historical-data';
import { createFallbackMultiAssetHistory } from './multi-asset-history';

describe('multi asset history data helpers', () => {
  it('creates a stable fallback envelope with default unavailable series flags', () => {
    expect(createFallbackMultiAssetHistory()).toEqual({
      data: HISTORICAL_RETURNS,
      source: 'fallback',
      usedFallback: true,
      coverageStart: HISTORICAL_RETURNS[0]?.date ?? '2020-01',
      coverageEnd: HISTORICAL_RETURNS[HISTORICAL_RETURNS.length - 1]?.date ?? '2024-06',
      seriesAvailability: {
        sp500: false,
        gold: false,
        inflation: false,
        nbpRate: false,
      },
    });
  });

  it('preserves known partial series availability in fallback mode', () => {
    expect(
      createFallbackMultiAssetHistory({
        sp500: true,
        gold: false,
        inflation: true,
        nbpRate: false,
      }),
    ).toMatchObject({
      source: 'fallback',
      usedFallback: true,
      seriesAvailability: {
        sp500: true,
        gold: false,
        inflation: true,
        nbpRate: false,
      },
    });
  });
});
