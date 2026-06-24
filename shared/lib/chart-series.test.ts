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

  it('preserves terminal values when range slicing is followed by sampling', () => {
    const series = Array.from({ length: 480 }).map((_, index) => ({
      date: `month-${index}`,
      nominalValue: 10_000 + index * 100,
      realValue: 9_500 + index * 80,
    }));

    const sliced = sliceSeriesByPeriod(series, '10Y');
    const sampled = sampleSeriesPoints(sliced, 25);

    expect(sliced[0]).toEqual(series[360]);
    expect(sliced.at(-1)).toEqual(series.at(-1));
    expect(sampled.at(-1)).toEqual(series.at(-1));
    expect(sampled.at(-1)?.nominalValue).toBe(57_900);
    expect(sampled.at(-1)?.realValue).toBe(47_820);
  });

  it('leaves purchase-date anchored full-series views untouched before sampling', () => {
    const purchaseDatePoint = {
      date: '2026-05-05',
      nominalValue: 10_000,
      realValue: 10_000,
    };
    const series = [
      purchaseDatePoint,
      ...Array.from({ length: 36 }).map((_, index) => ({
        date: `month-${index + 1}`,
        nominalValue: 10_100 + index * 100,
        realValue: 10_050 + index * 90,
      })),
    ];

    expect(sliceSeriesByPeriod(series, 'ALL')[0]).toEqual(purchaseDatePoint);
    expect(sampleSeriesPoints(sliceSeriesByPeriod(series, 'ALL'), 12)[0]).toEqual(
      purchaseDatePoint,
    );
    expect(sampleSeriesPoints(sliceSeriesByPeriod(series, 'ALL'), 12).at(-1)).toEqual(
      series.at(-1),
    );
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
