import { compareAsc, format, parseISO } from 'date-fns';
import { BondType } from '@/features/bond-core/types';
import { BondComparisonScenarioItem } from '@/features/bond-core/types/scenarios';
import { sampleSeriesPoints } from '@/shared/lib/chart-series';

export type ComparisonChartPoint = {
  date: string;
  year: number;
} & Partial<Record<BondType, number>>;

export function buildComparisonChartData(
  results: BondComparisonScenarioItem[],
  showRealValue: boolean,
): ComparisonChartPoint[] {
  if (results.length === 0) {
    return [];
  }

  const allDates = Array.from(
    new Set(results.flatMap((result) => result.result.timeline.map((point) => point.cycleEndDate))),
  )
    .map((date) => parseISO(date))
    .sort(compareAsc);

  const projected = allDates.map((date) => {
    const row: ComparisonChartPoint = {
      date: format(date, 'MMM yyyy'),
      year: date.getFullYear(),
    };

    results.forEach((result) => {
      let currentValue = result.result.initialInvestment;

      for (const point of result.result.timeline) {
        if (compareAsc(parseISO(point.cycleEndDate), date) <= 0) {
          currentValue = showRealValue ? point.realValue : point.totalValue;
        } else {
          break;
        }
      }

      row[result.type] = currentValue;
    });

    return row;
  });

  return sampleSeriesPoints(projected, 180);
}

export function getLeadingComparisonResult(results: BondComparisonScenarioItem[]) {
  if (results.length === 0) {
    return null;
  }

  return results.reduce((best, current) =>
    current.result.netPayoutValue > best.result.netPayoutValue ? current : best,
  );
}
