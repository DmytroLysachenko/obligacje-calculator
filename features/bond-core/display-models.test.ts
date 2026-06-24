import { describe, expect, it } from 'vitest';

import {
  buildBondChartDisplayPoints,
  buildBondTimelineDisplayRows,
  getAuditTimelinePoint,
  getRateSourceDisplayLabel,
  getSimulationEventDisplayLabel,
  normalizeBondChartDisplayTimeline,
} from '@/shared/lib/bond-display';

import { SimulationEventType } from './types/simulation';
import { YearlyTimelinePoint } from './types';

function makePoint(overrides: Partial<YearlyTimelinePoint> = {}): YearlyTimelinePoint {
  return {
    year: 1,
    periodLabel: 'Jun 2026',
    cycleIndex: 1,
    cycleStartDate: '2026-06-01',
    cycleEndDate: '2026-06-30',
    interestRate: 5.25,
    rateSource: 'historical_nbp',
    usedProjectedRate: false,
    nominalValueBeforeInterest: 10000,
    interestEarned: 43,
    taxDeducted: 0,
    netInterest: 43,
    nominalValueAfterInterest: 10043,
    accumulatedNetInterest: 43,
    totalValue: 10043,
    realValue: 9950,
    netProfit: 43,
    earlyWithdrawalValue: 10021,
    cumulativeInflation: 1.02,
    isMaturity: false,
    isWithdrawal: false,
    inflationReference: 3.5,
    nbpReference: 5.25,
    events: [
      {
        type: SimulationEventType.INTEREST_ACCRUAL,
        date: '2026-06-30',
        description: 'Interest accrual',
      },
    ],
    ...overrides,
  };
}

describe('bond display models', () => {
  it('maps rate source labels for both locales', () => {
    expect(getRateSourceDisplayLabel('historical_nbp', 'en')).toContain('Historical NBP');
    expect(getRateSourceDisplayLabel('projected_cpi', 'pl')).toContain('Prognozowany CPI');
  });

  it('maps event labels for both locales', () => {
    expect(getSimulationEventDisplayLabel(SimulationEventType.PAYOUT, 'en')).toBe('Payout');
    expect(getSimulationEventDisplayLabel(SimulationEventType.MATURITY, 'pl')).toBe('Zapadalnosc');
  });

  it('builds timeline display rows without raw engine labels', () => {
    const rows = buildBondTimelineDisplayRows(
      [
        makePoint({
          rateSource: 'historical_nbp',
          rateReferenceValue: 5.25,
          rateMarginApplied: 0,
          isProjected: true,
          events: [
            {
              type: SimulationEventType.RATE_RESET,
              date: '2026-06-01',
              description: 'Rate reset',
            },
          ],
        }),
      ],
      'en',
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].rateSourceLabel).toBe('Historical NBP + margin');
    expect(rows[0].eventLabels).toEqual(['Rate reset']);
    expect(rows[0].projectionLabel).toBe('Projected');
    expect(rows[0].referenceLabel).toContain('Base 5.25%');
    expect(rows[0].cycleLabel).toContain('Cycle 1:');
    expect(rows[0].valueMeaningLabel).toContain('checkpoint');
  });

  it('shows retained-interest semantics for capitalizing bonds instead of cash-payout wording', () => {
    const rows = buildBondTimelineDisplayRows(
      [
        makePoint({
          rateSource: 'first_year_fixed',
          nominalValueBeforeInterest: 10000,
          nominalValueAfterInterest: 10535,
          accumulatedNetInterest: 535,
          totalValue: 10535,
          events: [
            {
              type: SimulationEventType.INTEREST_ACCRUAL,
              date: '2027-05-31',
              description: 'Accrual',
            },
          ],
        }),
      ],
      'en',
    );

    expect(rows[0].cashFlowLabel).toBe('Interest retained in bond');
    expect(rows[0].valueMeaningLabel).toContain('inside the bond');
    expect(rows[0].paidOutCash).toBe(535);
  });

  it('builds chart display points from the first real checkpoint and preserves scenario bounds', () => {
    const lowPoint = makePoint({ nominalValueAfterInterest: 9900, totalValue: 9900 });
    const highPoint = makePoint({ nominalValueAfterInterest: 10100, totalValue: 10100 });
    const points = buildBondChartDisplayPoints(10000, [makePoint()], 'pl', {
      low: [lowPoint],
      high: [highPoint],
    });

    expect(points).toHaveLength(1);
    expect(points[0].xLabel).toContain('2026');
    expect(points[0].low).toBe(10000);
    expect(points[0].high).toBe(10000);
    expect(points[0].rateLabel).toContain('Kapital poczatkowy');
  });

  it('keeps chart aggregation as a display-only transform with the same terminal wealth', () => {
    const timeline = [
      makePoint({ cycleEndDate: '2026-01-31', totalValue: 10010, realValue: 10000 }),
      makePoint({ cycleEndDate: '2026-02-28', totalValue: 10030, realValue: 10015 }),
      makePoint({ cycleEndDate: '2026-03-31', totalValue: 10055, realValue: 10035 }),
      makePoint({ cycleEndDate: '2026-04-30', totalValue: 10080, realValue: 10050 }),
    ];

    const monthly = buildBondChartDisplayPoints(10000, timeline, 'en', undefined, 'monthly');
    const quarterly = buildBondChartDisplayPoints(10000, timeline, 'en', undefined, 'quarterly');
    const normalized = normalizeBondChartDisplayTimeline(timeline, 'en');

    expect(monthly.at(-1)?.nominal).toBe(10080);
    expect(quarterly.at(-1)?.nominal).toBe(10080);
    expect(normalized.at(-1)?.real).toBe(10050);
  });

  it('picks the first meaningful audit checkpoint instead of a raw purchase row', () => {
    const purchaseOnly = makePoint({
      periodLabel: 'May 2026',
      events: [
        {
          type: SimulationEventType.PURCHASE,
          date: '2026-05-14',
          description: 'Purchase',
        },
      ],
      netInterest: 0,
      accumulatedNetInterest: 0,
      isMaturity: false,
      isWithdrawal: false,
    });
    const payoutPoint = makePoint({
      periodLabel: 'Jun 2026',
      events: [
        {
          type: SimulationEventType.PAYOUT,
          date: '2026-06-30',
          description: 'Payout',
        },
      ],
      netInterest: 43,
      accumulatedNetInterest: 43,
    });

    const point = getAuditTimelinePoint([purchaseOnly, payoutPoint]);

    expect(point?.periodLabel).toBe('Jun 2026');
  });
});
