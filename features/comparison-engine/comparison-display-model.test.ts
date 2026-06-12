import {describe, expect, it} from 'vitest';
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
});
