import { describe, expect, it } from 'vitest';
import {
  computeNumericDomain,
  computeRateDomain,
  sampleSeriesPoints,
  sliceSeriesByPeriod,
} from './chart-series';

describe('chart-series helpers', () => {
  it('slices series by declared range windows', () => {
    const series = Array.from({ length: 400 }).map((_, index) => index + 1);

    expect(sliceSeriesByPeriod(series, '1Y')).toHaveLength(12);
    expect(sliceSeriesByPeriod(series, '5Y')).toHaveLength(60);
    expect(sliceSeriesByPeriod(series, '10Y')).toHaveLength(120);
    expect(sliceSeriesByPeriod(series, '30Y')).toHaveLength(360);
    expect(sliceSeriesByPeriod(series, 'ALL')).toHaveLength(400);
  });

  it('samples long series while preserving first and last points', () => {
    const series = Array.from({ length: 401 }).map((_, index) => ({
      id: index,
      value: index * 10,
    }));

    const sampled = sampleSeriesPoints(series, 25);

    expect(sampled.length).toBeLessThanOrEqual(26);
    expect(sampled[0]).toEqual(series[0]);
    expect(sampled[sampled.length - 1]).toEqual(series[series.length - 1]);
  });

  it('returns a safe numeric domain with padding and floor', () => {
    const domain = computeNumericDomain([10_000, 11_200, 15_400], {
      minFloor: 0,
      minPadding: 250,
      paddingRatio: 0.1,
    });

    expect(domain[0]).toBeGreaterThanOrEqual(0);
    expect(domain[0]).toBeLessThan(10_000);
    expect(domain[1]).toBeGreaterThan(15_400);
  });

  it('returns a stable fallback domain for empty series', () => {
    expect(computeNumericDomain([], { minFloor: 0, minPadding: 250 })).toEqual([0, 250]);
    expect(computeRateDomain([])).toEqual([-1, 1]);
  });

  it('expands rate domains around context-rate extremes', () => {
    const domain = computeRateDomain([-0.4, 1.2, 5.1]);

    expect(domain[0]).toBeLessThanOrEqual(-1);
    expect(domain[1]).toBeGreaterThanOrEqual(6);
  });
});
