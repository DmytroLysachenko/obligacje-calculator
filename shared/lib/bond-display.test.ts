import { describe, expect, it } from 'vitest';

import { type YearlyTimelinePoint } from '@/features/bond-core/types';
import { SimulationEventType } from '@/features/bond-core/types/simulation';

import { buildBondChartDisplayPoints, buildBondTimelineDisplayRows } from './bond-display';

function makeTimelinePoint(overrides: Partial<YearlyTimelinePoint>): YearlyTimelinePoint {
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

  it('densifies yearly checkpoints into monthly display points when monthly granularity is selected', () => {
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
        interestEarned: 535,
        netInterest: 535,
        nominalValueAfterInterest: 10535,
        totalValue: 10535,
        realValue: 10192.13,
        netProfit: 535,
        isProjected: true,
      }),
    ];

    const points = buildBondChartDisplayPoints(10000, timeline, 'en', undefined, 'monthly');
    const rows = buildBondTimelineDisplayRows(timeline, 'en', 'monthly');

    expect(points.length).toBeGreaterThan(2);
    expect(rows.length).toBeGreaterThan(2);
    expect(points[1]?.xLabel).toBe('Jun 2026');
    expect(rows[1]?.periodLabel).toBe('Jun 2026');
    expect(points.at(-1)?.xLabel).toBe('May 2027');
  });

  it('capitalizes Polish month labels in timeline rows and chart points', () => {
    const timeline: YearlyTimelinePoint[] = [
      makeTimelinePoint({
        periodLabel: 'Purchase',
        cycleEndDate: '2026-06-12',
      }),
    ];

    const points = buildBondChartDisplayPoints(10000, timeline, 'pl', undefined, 'monthly');
    const rows = buildBondTimelineDisplayRows(timeline, 'pl', 'monthly');

    expect(points[0].xLabel).toBe('Cze 2026');
    expect(rows[0].periodLabel).toBe('Cze 2026');
  });

  it('keeps CPI and NBP reference overlays flat between yearly checkpoints when densifying', () => {
    const timeline: YearlyTimelinePoint[] = [
      makeTimelinePoint({
        periodLabel: 'Purchase',
        cycleEndDate: '2026-05-19',
        inflationReference: 2.5,
        nbpReference: 3.75,
      }),
      makeTimelinePoint({
        year: 2,
        periodLabel: 'Year 1',
        cycleEndDate: '2027-05-19',
        inflationReference: 3.5,
        nbpReference: 4.25,
        nominalValueBeforeInterest: 10000,
        interestEarned: 535,
        netInterest: 535,
        nominalValueAfterInterest: 10535,
        totalValue: 10535,
        realValue: 10192.13,
        netProfit: 535,
        isProjected: true,
      }),
    ];

    const points = buildBondChartDisplayPoints(10000, timeline, 'en', undefined, 'monthly');

    expect(points[0]?.inflation).toBe(2.5);
    expect(points[0]?.nbp).toBe(3.75);
    expect(points[1]?.inflation).toBe(2.5);
    expect(points[1]?.nbp).toBe(3.75);
    expect(points.at(-1)?.inflation).toBe(3.5);
    expect(points.at(-1)?.nbp).toBe(4.25);
  });

  it('anchors quarterly and yearly chart aggregation to the purchase date cadence', () => {
    const timeline: YearlyTimelinePoint[] = [
      makeTimelinePoint({
        periodLabel: 'Purchase',
        cycleEndDate: '2026-06-12',
      }),
      makeTimelinePoint({
        periodLabel: 'Aug checkpoint',
        cycleEndDate: '2026-08-12',
        totalValue: 10050,
        realValue: 9950,
      }),
      makeTimelinePoint({
        periodLabel: 'Sep checkpoint',
        cycleEndDate: '2026-09-12',
        totalValue: 10080,
        realValue: 9970,
      }),
      makeTimelinePoint({
        periodLabel: 'Year checkpoint',
        cycleEndDate: '2027-06-12',
        totalValue: 10400,
        realValue: 10010,
        isMaturity: true,
      }),
    ];

    const quarterly = buildBondChartDisplayPoints(10000, timeline, 'en', undefined, 'quarterly');
    const yearly = buildBondChartDisplayPoints(10000, timeline, 'en', undefined, 'yearly');

    expect(quarterly[0]?.dateKey).toBe('2026-06-12');
    expect(quarterly[1]?.dateKey).toBe('2026-09-12');
    expect(yearly[0]?.dateKey).toBe('2026-06-12');
    expect(yearly[1]?.dateKey).toBe('2027-06-12');
    expect(yearly.at(-1)?.nominal).toBe(10400);
  });

  it('uses the same purchase-date cadence for quarterly timeline rows', () => {
    const timeline: YearlyTimelinePoint[] = [
      makeTimelinePoint({
        periodLabel: 'Purchase',
        cycleEndDate: '2026-06-12',
      }),
      makeTimelinePoint({
        periodLabel: 'Year checkpoint',
        cycleEndDate: '2027-06-12',
        totalValue: 10400,
        realValue: 10010,
        netProfit: 400,
        isMaturity: true,
      }),
    ];

    const rows = buildBondTimelineDisplayRows(timeline, 'en', 'quarterly');

    expect(rows.map((row) => row.periodLabel)).toEqual([
      'Jun 2026',
      'Sept 2026',
      'Dec 2026',
      'Mar 2027',
      'Jun 2027',
    ]);
    expect(rows.at(-1)).toMatchObject({
      totalWealth: 10400,
      netProfit: 400,
      isWithdrawal: false,
    });
  });

  it('keeps yearly timeline rows on actual engine checkpoints', () => {
    const timeline: YearlyTimelinePoint[] = [
      makeTimelinePoint({
        periodLabel: 'Purchase',
        cycleEndDate: '2026-06-12',
      }),
      makeTimelinePoint({
        periodLabel: 'Year 1',
        cycleEndDate: '2027-06-12',
        totalValue: 10375,
      }),
      makeTimelinePoint({
        periodLabel: 'Withdrawal',
        cycleEndDate: '2027-09-12',
        totalValue: 10450,
        isWithdrawal: true,
      }),
    ];

    const rows = buildBondTimelineDisplayRows(timeline, 'en', 'yearly');

    expect(rows.map((row) => row.periodLabel)).toEqual(['Jun 2026', 'Jun 2027', 'Sept 2027']);
    expect(rows.at(-1)?.totalWealth).toBe(10450);
  });

  it('aggregates naturally monthly timeline rows when quarterly or yearly display is selected', () => {
    const timeline: YearlyTimelinePoint[] = Array.from({ length: 25 }, (_, index) =>
      makeTimelinePoint({
        periodLabel: `Month ${index}`,
        cycleEndDate: new Date(Date.UTC(2026, 5 + index, 12)).toISOString().slice(0, 10),
        totalValue: 10000 + index * 25,
        realValue: 10000 + index * 10,
        netProfit: index * 25,
      }),
    );

    const monthly = buildBondTimelineDisplayRows(timeline, 'en', 'monthly');
    const quarterly = buildBondTimelineDisplayRows(timeline, 'en', 'quarterly');
    const yearly = buildBondTimelineDisplayRows(timeline, 'en', 'yearly');

    expect(monthly).toHaveLength(25);
    expect(quarterly.map((row) => row.periodLabel)).toEqual([
      'Jun 2026',
      'Sept 2026',
      'Dec 2026',
      'Mar 2027',
      'Jun 2027',
      'Sept 2027',
      'Dec 2027',
      'Mar 2028',
      'Jun 2028',
    ]);
    expect(yearly.map((row) => row.periodLabel)).toEqual(['Jun 2026', 'Jun 2027', 'Jun 2028']);
  });

  it('deduplicates repeated period event badges inside aggregated timeline rows', () => {
    const timeline: YearlyTimelinePoint[] = Array.from({ length: 12 }, (_, index) =>
      makeTimelinePoint({
        periodLabel: `Month ${index}`,
        cycleEndDate: new Date(Date.UTC(2026, 5 + index, 12)).toISOString().slice(0, 10),
        totalValue: 10000 + index * 25,
        realValue: 10000 + index * 10,
        netProfit: index * 25,
        events: [
          {
            type: SimulationEventType.PAYOUT,
            date: new Date(Date.UTC(2026, 5 + index, 12)).toISOString().slice(0, 10),
            description: `Payout ${index}`,
          },
          {
            type: SimulationEventType.TAX_SETTLEMENT,
            date: new Date(Date.UTC(2026, 5 + index, 12)).toISOString().slice(0, 10),
            description: `Tax ${index}`,
          },
        ],
      }),
    );

    const yearly = buildBondTimelineDisplayRows(timeline, 'en', 'yearly');

    expect(yearly[0].eventLabels).toEqual(['Payout', 'Tax settlement']);
  });
});
