import {describe, expect, it} from 'vitest';
import {CalculationResult} from '@/features/bond-core/types';
import {
  buildComparisonAlignedTableRows,
  getComparisonTablePageCount,
  getComparisonTablePageRows,
} from './lib/comparison-table-model';

function point(date: string, totalValue: number) {
  return {
    cycleEndDate: date,
    totalValue,
    realValue: totalValue * 0.9,
    netProfit: totalValue - 10000,
  };
}

function result(timeline: ReturnType<typeof point>[], initialInvestment = 10000) {
  return {
    initialInvestment,
    timeline,
    netPayoutValue: timeline.at(-1)?.totalValue ?? initialInvestment,
    finalRealValue: timeline.at(-1)?.realValue ?? initialInvestment,
    totalProfit: (timeline.at(-1)?.totalValue ?? initialInvestment) - initialInvestment,
    totalTax: 0,
  } as CalculationResult;
}

describe('comparison aligned table model', () => {
  it('aligns different bond cadences by date instead of row index', () => {
    const rows = buildComparisonAlignedTableRows({
      resultsA: result([
        point('2026-05-22', 10000),
        point('2026-06-22', 10025),
        point('2026-07-22', 10050),
        point('2027-05-22', 10300),
      ]),
      resultsB: result([
        point('2026-05-22', 10000),
        point('2027-05-22', 11200),
      ]),
      purchaseDate: '2026-05-22',
      granularity: 'monthly',
      language: 'en',
    });

    const june = rows.find((row) => row.dateLabel === '2026-06-22');

    expect(june?.scenarioA.nominalValue).toBe(10025);
    expect(june?.scenarioA.realValue).toBe(9022.5);
    expect(june?.scenarioA.netProfit).toBe(25);
    expect(june?.scenarioB.nominalValue).toBeGreaterThan(10000);
    expect(june?.scenarioB.nominalValue).toBeLessThan(11200);
    expect(june?.leader).toBe('B');
  });

  it('aggregates aligned rows without changing terminal comparison values', () => {
    const rows = buildComparisonAlignedTableRows({
      resultsA: result([
        point('2026-05-22', 10000),
        point('2026-06-22', 10025),
        point('2026-07-22', 10050),
        point('2027-05-22', 10300),
      ]),
      resultsB: result([
        point('2026-05-22', 10000),
        point('2027-05-22', 11200),
      ]),
      purchaseDate: '2026-05-22',
      granularity: 'yearly',
      language: 'en',
    });

    expect(rows.at(-1)?.scenarioA.nominalValue).toBe(10300);
    expect(rows.at(-1)?.scenarioB.nominalValue).toBe(11200);
    expect(rows.at(-1)?.gap).toBe(900);
    expect(rows.length).toBe(2);
  });

  it('keeps aggregated table rows anchored to the purchase date', () => {
    const rows = buildComparisonAlignedTableRows({
      resultsA: result([
        point('2026-08-12', 10072.42),
        point('2027-06-12', 10535),
      ]),
      resultsB: result([
        point('2026-08-12', 10052.58),
        point('2027-06-12', 10375),
      ]),
      purchaseDate: '2026-06-12',
      granularity: 'quarterly',
      language: 'en',
    });

    expect(rows[0]).toMatchObject({
      label: 'Start',
      dateLabel: '2026-06-12',
    });
    expect(rows[1]?.dateLabel).toBe('2026-09-12');
  });

  it('keeps yearly table rows on purchase anniversaries and preserves the final withdrawal row', () => {
    const rows = buildComparisonAlignedTableRows({
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
      purchaseDate: '2026-06-12',
      granularity: 'yearly',
      language: 'en',
    });

    expect(rows.map((row) => row.dateLabel)).toEqual([
      '2026-06-12',
      '2027-06-12',
      '2028-06-12',
      '2028-09-12',
    ]);
    expect(rows.at(-1)).toMatchObject({
      gap: -400,
      leader: 'A',
    });
  });

  it('paginates aligned comparison rows instead of only truncating the first page', () => {
    const rows = Array.from({ length: 30 }, (_, index) => ({ index }));

    expect(getComparisonTablePageCount(rows.length, 12)).toBe(3);
    expect(getComparisonTablePageRows({ rows, rowLimit: 12, page: 2 }).map((row) => row.index)).toEqual([
      12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    ]);
    expect(getComparisonTablePageRows({ rows, rowLimit: 'all', page: 3 })).toHaveLength(30);
  });
});
