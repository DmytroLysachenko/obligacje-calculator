import { describe, expect, it } from 'vitest';

import { applyChartContextRates, getChartContextRatesForDate } from './chart-context-rates';

describe('chart-context-rates', () => {
  it('uses simple expected rates for every chart point without mutating engine timeline fields', () => {
    const points = [
      {
        dateKey: '2026-05-27T00:00:00.000Z',
        inflation: 2.3,
        nbp: 3.75,
      },
      {
        dateKey: '2029-05-27T00:00:00.000Z',
        inflation: 2.3,
        nbp: 3.75,
      },
    ];

    const adjusted = applyChartContextRates(points, {
      purchaseDate: '2026-05-27T00:00:00.000Z',
      expectedInflation: 3.8,
      expectedNbpRate: 3.55,
    });

    expect(adjusted).toEqual([
      {
        dateKey: '2026-05-27T00:00:00.000Z',
        inflation: 3.8,
        nbp: 3.55,
      },
      {
        dateKey: '2029-05-27T00:00:00.000Z',
        inflation: 3.8,
        nbp: 3.55,
      },
    ]);
    expect(points[0].inflation).toBe(2.3);
    expect(points[0].nbp).toBe(3.75);
  });

  it('reads yearly advanced paths by elapsed years from purchase date', () => {
    const firstYear = getChartContextRatesForDate(
      {
        purchaseDate: '2026-05-27T00:00:00.000Z',
        expectedInflation: 2.5,
        expectedNbpRate: 3.75,
        customInflation: [2, 3, 4],
        customNbpRate: [3.5, 4.5, 5.5],
      },
      '2026-12-12T00:00:00.000Z',
    );
    const thirdYear = getChartContextRatesForDate(
      {
        purchaseDate: '2026-05-27T00:00:00.000Z',
        expectedInflation: 2.5,
        expectedNbpRate: 3.75,
        customInflation: [2, 3, 4],
        customNbpRate: [3.5, 4.5, 5.5],
      },
      '2028-12-12T00:00:00.000Z',
    );
    const beyondPath = getChartContextRatesForDate(
      {
        purchaseDate: '2026-05-27T00:00:00.000Z',
        expectedInflation: 2.5,
        expectedNbpRate: 3.75,
        customInflation: [2, 3, 4],
        customNbpRate: [3.5, 4.5, 5.5],
      },
      '2035-12-12T00:00:00.000Z',
    );

    expect(firstYear).toEqual({ inflation: 2, nbp: 3.5 });
    expect(thirdYear).toEqual({ inflation: 4, nbp: 5.5 });
    expect(beyondPath).toEqual({ inflation: 4, nbp: 5.5 });
  });
});
