import { describe, expect, it } from 'vitest';
import { BondType, InterestPayout, type YearlyTimelinePoint } from '@/features/bond-core/types';
import { buildBondChartDisplayPoints } from './bond-display';

function makeTimelinePoint(
  overrides: Partial<YearlyTimelinePoint>,
): YearlyTimelinePoint {
  return {
    year: 1,
    periodLabel: 'Purchase',
    cycleIndex: 1,
    cycleStartDate: '2026-05-19',
    cycleEndDate: '2026-05-19',
    interestRate: 5.35,
    rateSource: 'initial_principal',
    usedProjectedRate: false,
    nominalValueBeforeInterest: 10000,
    interestEarned: 0,
    taxDeducted: 0,
    netInterest: 0,
    nominalValueAfterInterest: 10000,
    accumulatedNetInterest: 0,
    totalValue: 10000,
    realValue: 10000,
    netProfit: 0,
    earlyWithdrawalValue: 10000,
    cumulativeInflation: 0,
    isMaturity: false,
    isWithdrawal: false,
    ...overrides,
  };
}

describe('buildBondChartDisplayPoints', () => {
  it('starts the chart at the first real checkpoint month instead of a synthetic Start point', () => {
    const timeline: YearlyTimelinePoint[] = [
      makeTimelinePoint({
        periodLabel: 'Purchase',
        cycleEndDate: '2026-05-19',
      }),
      makeTimelinePoint({
        year: 2,
        periodLabel: 'Year 1',
        cycleEndDate: '2027-05-19',
        nominalValueBeforeInterest: 10000,
        interestEarned: 725,
        netInterest: 725,
        nominalValueAfterInterest: 10725,
        totalValue: 10725,
        realValue: 10377.79,
        netProfit: 725,
        isProjected: true,
      }),
    ];

    const points = buildBondChartDisplayPoints(10000, timeline, 'en', undefined, 'yearly');

    expect(points[0].xLabel).toBe('May 2026');
    expect(points[0].nominal).toBe(10000);
    expect(points.find((point) => point.xLabel === 'Start')).toBeUndefined();
  });
});
