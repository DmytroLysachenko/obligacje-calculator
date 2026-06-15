import {describe, expect, it} from 'vitest';
import {parseISO} from 'date-fns';
import {CalculationResult, ChartStep} from '@/features/bond-core/types';
import {buildComparisonChartData} from './lib/comparison-display';

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
    resultsB: result([
      point('2026-05-22', 10000),
      point('2027-05-22', 11000),
    ]),
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
      resultsA: result([
        point('2026-08-12', 10072.42),
        point('2027-06-12', 10535),
      ]),
      resultsB: result([
        point('2026-08-12', 10052.58),
        point('2027-06-12', 10375),
      ]),
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
});
