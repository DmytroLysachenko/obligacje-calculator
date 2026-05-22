import { describe, expect, it } from 'vitest';
import { buildRegularInvestmentChartPoints } from './regular-investment-display';
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
});
