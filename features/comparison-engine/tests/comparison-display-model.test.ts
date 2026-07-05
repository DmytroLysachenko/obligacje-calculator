import { parseISO } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { CalculationResult, ChartStep } from '@/features/bond-core/types';

import { buildComparisonChartData } from '../lib/comparison-display';

function point(date: string, totalValue: number, realValue = totalValue) {
  return {
    cycleEndDate: date,
    totalValue,
    realValue,
    inflationReference: 2.5,
    nbpReference: 3.75,
    isProjected: true,
  };
}

function result(timeline: ReturnType<typeof point>[], initialInvestment = 10000) {
  return {
    initialInvestment,
    timeline,
  } as CalculationResult;
}

function build(step: ChartStep) {
  return buildComparisonChartData({
    purchaseDate: '2026-05-22',
    withdrawalDateA: '2027-05-22',
    withdrawalDateB: '2027-05-22',
    resultsA: result([
      point('2026-05-22', 10000),
      point('2026-06-22', 10020),
      point('2026-07-22', 10040),
      point('2027-05-22', 10300),
    ]),
    resultsB: result([point('2026-05-22', 10000), point('2027-05-22', 11000)]),
    language: 'en',
    t: (key) => key,
    chartStep: step,
  });
}

describe('comparison display model', () => {
  it('interpolates sparse annual scenario values for monthly chart display', () => {
    const monthly = build('monthly');
    const june = monthly.find((item) => item.label === 'Jun 2026');

    expect(june?.nominalA).toBe(10020);
    expect(june?.nominalB).toBeGreaterThan(10000);
    expect(june?.nominalB).toBeLessThan(11000);
    expect(june?.nominalB).not.toBe(10000);
  });

  it('keeps terminal values unchanged after chart aggregation', () => {
    const quarterly = build('quarterly');
    const yearly = build('yearly');

    expect(quarterly.at(-1)?.nominalA).toBe(10300);
    expect(quarterly.at(-1)?.nominalB).toBe(11000);
    expect(yearly.at(-1)?.nominalA).toBe(10300);
    expect(yearly.at(-1)?.nominalB).toBe(11000);
  });

  it('keeps aggregated chart points anchored to the purchase date cadence', () => {
    const quarterly = buildComparisonChartData({
      purchaseDate: '2026-06-12',
      withdrawalDateA: '2027-06-12',
      withdrawalDateB: '2027-06-12',
      resultsA: result([point('2026-08-12', 10072.42), point('2027-06-12', 10535)]),
      resultsB: result([point('2026-08-12', 10052.58), point('2027-06-12', 10375)]),
      language: 'en',
      t: (key) => key,
      chartStep: 'quarterly',
    });

    expect(quarterly[0]).toMatchObject({
      label: 'comparison.start',
      dateKey: parseISO('2026-06-12').toISOString(),
    });
    expect(quarterly[1]?.label).toBe('Sep 2026');
  });

  it('keeps yearly comparison charts anchored to purchase anniversaries plus terminal date', () => {
    const yearly = buildComparisonChartData({
      purchaseDate: '2026-06-12',
      withdrawalDateA: '2028-09-12',
      withdrawalDateB: '2028-09-12',
      resultsA: result([
        point('2027-06-12', 10535),
        point('2028-06-12', 11120),
        point('2028-09-12', 11200),
      ]),
      resultsB: result([
        point('2027-06-12', 10375),
        point('2028-06-12', 10740),
        point('2028-09-12', 10800),
      ]),
      language: 'en',
      t: (key) => key,
      chartStep: 'yearly',
    });

    expect(yearly.map((item) => item.label)).toEqual([
      'comparison.start',
      'Jun 2027',
      'Jun 2028',
      'Sep 2028',
    ]);
    expect(yearly.at(-1)).toMatchObject({
      nominalA: 11200,
      nominalB: 10800,
    });
  });

  it('preserves every monthly point for a 20-year sparse yearly timeline', () => {
    const yearlyTimeline = Array.from({ length: 21 }, (_, index) =>
      point(new Date(Date.UTC(2026 + index, 5, 1)).toISOString().slice(0, 10), 10000 + index * 600),
    );

    const monthly = buildComparisonChartData({
      purchaseDate: '2026-06-01',
      withdrawalDateA: '2046-06-01',
      withdrawalDateB: '2046-06-01',
      resultsA: result(yearlyTimeline),
      resultsB: result(yearlyTimeline),
      language: 'en',
      t: (key) => key,
      chartStep: 'monthly',
    });

    expect(monthly).toHaveLength(241);
    expect(monthly.slice(0, 4).map((item) => item.label)).toEqual([
      'comparison.start',
      'Jul 2026',
      'Aug 2026',
      'Sep 2026',
    ]);
    expect(monthly.at(-1)?.label).toBe('Jun 2046');
  });
});
