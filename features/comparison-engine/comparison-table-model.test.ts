import {describe, expect, it} from 'vitest';
import {CalculationResult} from '@/features/bond-core/types';
import {
  buildComparisonAlignedTableRows,
  getComparisonTablePageCount,
  getComparisonTablePageRows,
} from './components/ComparisonTable';

function point(date: string, totalValue: number) {
  return {
    cycleEndDate: date,
    totalValue,
    realValue: totalValue,
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
      granularity: 'monthly',
      language: 'en',
    });

    const june = rows.find((row) => row.dateLabel === '2026-06-22');

    expect(june?.valueA).toBe(10025);
    expect(june?.valueB).toBeGreaterThan(10000);
    expect(june?.valueB).toBeLessThan(11200);
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
      granularity: 'yearly',
      language: 'en',
    });

    expect(rows.at(-1)?.valueA).toBe(10300);
    expect(rows.at(-1)?.valueB).toBe(11200);
    expect(rows.length).toBe(2);
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
