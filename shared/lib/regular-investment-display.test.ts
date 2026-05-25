import { describe, expect, it } from 'vitest';
import {
  buildRecentRegularInvestmentLots,
  buildRegularInvestmentChartPoints,
  buildRegularInvestmentYearBuckets,
} from './regular-investment-display';
import { RegularInvestmentResult } from '@/features/bond-core/types';

const timeline: RegularInvestmentResult['timeline'] = [
  {
    month: 0,
    date: '2026-01-01T00:00:00.000Z',
    totalInvested: 1000,
    nominalValue: 1000,
    realValue: 1000,
    profit: 0,
    tax: 0,
    earlyWithdrawalFees: 0,
  },
  {
    month: 1,
    date: '2026-02-01T00:00:00.000Z',
    totalInvested: 2000,
    nominalValue: 2010,
    realValue: 1998,
    profit: 10,
    tax: 0,
    earlyWithdrawalFees: 0,
  },
  {
    month: 2,
    date: '2026-03-01T00:00:00.000Z',
    totalInvested: 3000,
    nominalValue: 3030,
    realValue: 3001,
    profit: 30,
    tax: 0,
    earlyWithdrawalFees: 0,
  },
  {
    month: 3,
    date: '2026-04-01T00:00:00.000Z',
    totalInvested: 4000,
    nominalValue: 4060,
    realValue: 4010,
    profit: 60,
    tax: 0,
    earlyWithdrawalFees: 0,
  },
  {
    month: 4,
    date: '2026-05-01T00:00:00.000Z',
    totalInvested: 5000,
    nominalValue: 5100,
    realValue: 5009,
    profit: 100,
    tax: 0,
    earlyWithdrawalFees: 0,
  },
];

describe('regular investment display helpers', () => {
  it('keeps monthly chart data unaggregated', () => {
    const points = buildRegularInvestmentChartPoints(
      timeline,
      'monthly',
      (date) => date.toISOString().slice(0, 7),
      'nominal',
    );

    expect(points).toHaveLength(timeline.length);
    expect(points[1]?.date).toBe('2026-02');
  });

  it('aggregates quarterly chart data to the last point in each quarter', () => {
    const points = buildRegularInvestmentChartPoints(
      timeline,
      'quarterly',
      (date) => date.toISOString().slice(0, 7),
      'nominal',
    );

    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ date: '2026-03', invested: 3000, value: 3030 });
    expect(points[1]).toMatchObject({ date: '2026-05', invested: 5000, value: 5100 });
  });

  it('builds yearly buckets from lots for summary tables', () => {
    const buckets = buildRegularInvestmentYearBuckets([
      {
        purchaseDate: '2026-01-01T00:00:00.000Z',
        investedAmount: 1000,
        accumulatedInterest: 50,
        tax: 5,
        netValue: 1045,
      },
      {
        purchaseDate: '2026-06-01T00:00:00.000Z',
        investedAmount: 1000,
        accumulatedInterest: 30,
        tax: 3,
        netValue: 1027,
      },
      {
        purchaseDate: '2027-01-01T00:00:00.000Z',
        investedAmount: 1000,
        accumulatedInterest: 40,
        tax: 4,
        netValue: 1036,
      },
    ] as never);

    expect(buckets).toHaveLength(2);
    expect(buckets[0]).toMatchObject({
      year: '2026',
      count: 2,
      invested: 2000,
      interest: 80,
      tax: 8,
      netValue: 2072,
    });
  });

  it('returns recent lots ordered by newest purchase date first', () => {
    const recent = buildRecentRegularInvestmentLots([
      {
        purchaseDate: '2026-01-01T00:00:00.000Z',
        maturityDate: '2027-01-01T00:00:00.000Z',
        investedAmount: 1000,
      },
      {
        purchaseDate: '2026-03-01T00:00:00.000Z',
        maturityDate: '2027-03-01T00:00:00.000Z',
        investedAmount: 1000,
      },
    ] as never, 1);

    expect(recent).toHaveLength(1);
    expect(recent[0]?.value.purchaseDate).toBe('2026-03-01T00:00:00.000Z');
  });
});
