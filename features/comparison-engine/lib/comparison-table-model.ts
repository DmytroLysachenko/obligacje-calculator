import { addMonths, compareAsc, differenceInMonths, format, parseISO } from 'date-fns';

import { CalculationResult, ChartStep } from '@/features/bond-core/types';
import { capitalizePolishDateLabel, getDateFnsLocale } from '@/i18n/locale-utils';
import { TableRowLimit } from '@/shared/components/results/TableDensityControls';

import { ComparisonSummaryRow } from '../types/comparison-table';

import {
  type ComparisonScenarioSnapshot,
  projectTimelineSnapshot,
} from './comparison-table-projection';

export type ComparisonTableGranularity = Exclude<ChartStep, 'daily'>;

export type { ComparisonScenarioSnapshot } from './comparison-table-projection';

export type ComparisonAlignedTableRow = {
  key: string;
  label: string;
  dateLabel: string;
  scenarioA: ComparisonScenarioSnapshot;
  scenarioB: ComparisonScenarioSnapshot;
  gap: number;
  leader: 'A' | 'B' | 'tie';
};

export function buildComparisonSummaryRows({
  resultsA,
  resultsB,
  labels,
}: {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  labels: {
    netPayout: string;
    realValue: string;
    netProfit: string;
    taxPaid: string;
  };
}): ComparisonSummaryRow[] {
  return [
    {
      label: labels.netPayout,
      a: resultsA.netPayoutValue,
      b: resultsB.netPayoutValue,
    },
    {
      label: labels.realValue,
      a: resultsA.finalRealValue,
      b: resultsB.finalRealValue,
    },
    {
      label: labels.netProfit,
      a: resultsA.totalProfit,
      b: resultsB.totalProfit,
    },
    {
      label: labels.taxPaid,
      a: resultsA.totalTax,
      b: resultsB.totalTax,
    },
  ];
}

export function getComparisonTablePageCount(totalRows: number, rowLimit: TableRowLimit) {
  if (rowLimit === 'all') {
    return 1;
  }

  return Math.max(1, Math.ceil(totalRows / rowLimit));
}

export function getComparisonTablePageRows<T>({
  rows,
  rowLimit,
  page,
}: {
  rows: T[];
  rowLimit: TableRowLimit;
  page: number;
}) {
  if (rowLimit === 'all') {
    return rows;
  }

  const safePage = Math.max(1, Math.min(page, getComparisonTablePageCount(rows.length, rowLimit)));
  const startIndex = (safePage - 1) * rowLimit;

  return rows.slice(startIndex, startIndex + rowLimit);
}

export function getComparisonVisibleRangeLabel({
  page,
  rowLimit,
  visibleRows,
  totalRows,
}: {
  page: number;
  rowLimit: TableRowLimit;
  visibleRows: number;
  totalRows: number;
}) {
  if (totalRows === 0) {
    return '0 / 0';
  }

  if (rowLimit === 'all') {
    return `${totalRows} / ${totalRows}`;
  }

  const start = (page - 1) * rowLimit + 1;
  const end = Math.min(start + visibleRows - 1, totalRows);

  return `${start}-${end} / ${totalRows}`;
}

export function buildComparisonAlignedTableRows({
  resultsA,
  resultsB,
  purchaseDate,
  granularity,
  language,
  startLabel = 'Start',
}: {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  purchaseDate: string;
  granularity: ComparisonTableGranularity;
  language: 'pl' | 'en';
  startLabel?: string;
}): ComparisonAlignedTableRow[] {
  const firstA = resultsA.timeline[0];
  const firstB = resultsB.timeline[0];
  const lastA = resultsA.timeline.at(-1);
  const lastB = resultsB.timeline.at(-1);

  if (!firstA || !firstB || !lastA || !lastB) {
    return [];
  }

  const startDate = parseISO(purchaseDate);
  const endDate =
    compareAsc(parseISO(lastA.cycleEndDate), parseISO(lastB.cycleEndDate)) >= 0
      ? parseISO(lastA.cycleEndDate)
      : parseISO(lastB.cycleEndDate);
  const dates: Date[] = [];

  for (let cursor = startDate; compareAsc(cursor, endDate) <= 0; cursor = addMonths(cursor, 1)) {
    dates.push(cursor);
  }

  if (dates.length === 0 || dates.at(-1)?.getTime() !== endDate.getTime()) {
    dates.push(endDate);
  }

  const rawRows = dates.map((date, index) => {
    const scenarioA = projectTimelineSnapshot(
      resultsA.timeline,
      date,
      resultsA.initialInvestment,
      language,
    );
    const scenarioB = projectTimelineSnapshot(
      resultsB.timeline,
      date,
      resultsB.initialInvestment,
      language,
    );
    const gap = scenarioB.nominalValue - scenarioA.nominalValue;

    return {
      key: date.toISOString(),
      label:
        index === 0
          ? startLabel
          : capitalizePolishDateLabel(
              format(date, 'MMM yyyy', { locale: getDateFnsLocale(language) }),
              language,
            ),
      dateLabel: format(date, 'yyyy-MM-dd'),
      scenarioA,
      scenarioB,
      gap,
      leader: gap === 0 ? 'tie' : gap > 0 ? 'B' : 'A',
    } satisfies ComparisonAlignedTableRow;
  });

  if (granularity === 'monthly') {
    return rawRows;
  }

  const groups = new Map<string, ComparisonAlignedTableRow[]>();

  for (const row of rawRows) {
    const date = parseISO(row.key);
    const monthsFromStart = Math.max(0, differenceInMonths(date, startDate));
    const groupKey =
      granularity === 'quarterly'
        ? `q-${Math.floor(monthsFromStart / 3)}`
        : `y-${Math.floor(monthsFromStart / 12)}`;
    const bucket = groups.get(groupKey) ?? [];
    bucket.push(row);
    groups.set(groupKey, bucket);
  }

  const aggregated = Array.from(groups.values()).map((bucket) => bucket[0]);
  const terminal = rawRows.at(-1);

  if (terminal && aggregated.at(-1)?.key !== terminal.key) {
    aggregated.push(terminal);
  }

  return aggregated;
}
