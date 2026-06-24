import { addMonths, compareAsc, differenceInMonths, format, parseISO } from 'date-fns';

import { CalculationResult, ChartStep } from '@/features/bond-core/types';
import { SimulationEventType } from '@/features/bond-core/types/simulation';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { TableRowLimit } from '@/shared/components/results/TableDensityControls';
import {
  AppLanguage,
  getRateSourceDisplayLabel,
  getSimulationEventDisplayLabel,
} from '@/shared/lib/bond-display';

import { ComparisonSummaryRow } from '../types/comparison-table';

export type ComparisonTableGranularity = Exclude<ChartStep, 'daily'>;

export type ComparisonScenarioSnapshot = {
  nominalValue: number;
  realValue: number;
  netProfit: number;
  taxDeducted: number;
  interestRate?: number;
  rateSourceLabel?: string;
  eventLabels: string[];
};

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

function interpolateValue(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function interpolateTimelineNumber(
  previousValue: number | undefined,
  nextValue: number | undefined,
  fallback: number,
  progress: number,
) {
  if (
    typeof previousValue !== 'number' ||
    typeof nextValue !== 'number' ||
    !Number.isFinite(previousValue) ||
    !Number.isFinite(nextValue)
  ) {
    return fallback;
  }

  return interpolateValue(previousValue, nextValue, progress);
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

function projectTimelineSnapshot(
  timeline: CalculationResult['timeline'],
  date: Date,
  initialInvestment: number,
  language: AppLanguage,
) {
  let currentSnapshot: ComparisonScenarioSnapshot = {
    nominalValue: initialInvestment,
    realValue: initialInvestment,
    netProfit: 0,
    taxDeducted: 0,
    eventLabels: [],
  };
  let index = 0;

  while (index < timeline.length && compareAsc(parseISO(timeline[index].cycleEndDate), date) <= 0) {
    const point = timeline[index];
    currentSnapshot = {
      nominalValue: point.totalValue,
      realValue: point.realValue ?? point.totalValue,
      netProfit: point.netProfit ?? point.totalValue - initialInvestment,
      taxDeducted: point.taxDeducted ?? 0,
      interestRate: point.interestRate,
      rateSourceLabel: point.rateSource
        ? getRateSourceDisplayLabel(point.rateSource, language)
        : undefined,
      eventLabels:
        point.events?.map((event) =>
          getSimulationEventDisplayLabel(event.type as SimulationEventType, language),
        ) ?? [],
    };
    index += 1;
  }

  const previousPoint = timeline[Math.max(0, index - 1)];
  const nextPoint = timeline[index];

  if (!previousPoint || !nextPoint) {
    return currentSnapshot;
  }

  const previousDate = parseISO(previousPoint.cycleEndDate);
  const nextDate = parseISO(nextPoint.cycleEndDate);
  const previousTime = previousDate.getTime();
  const nextTime = nextDate.getTime();
  const currentTime = date.getTime();

  if (nextTime <= previousTime || currentTime <= previousTime || currentTime >= nextTime) {
    return currentSnapshot;
  }

  const progress = (currentTime - previousTime) / (nextTime - previousTime);

  return {
    nominalValue: interpolateTimelineNumber(
      previousPoint.totalValue,
      nextPoint.totalValue,
      currentSnapshot.nominalValue,
      progress,
    ),
    realValue: interpolateTimelineNumber(
      previousPoint.realValue,
      nextPoint.realValue,
      currentSnapshot.realValue,
      progress,
    ),
    netProfit: interpolateTimelineNumber(
      previousPoint.netProfit,
      nextPoint.netProfit,
      currentSnapshot.netProfit,
      progress,
    ),
    taxDeducted: interpolateTimelineNumber(
      previousPoint.taxDeducted,
      nextPoint.taxDeducted,
      currentSnapshot.taxDeducted,
      progress,
    ),
    interestRate: currentSnapshot.interestRate,
    rateSourceLabel: currentSnapshot.rateSourceLabel,
    eventLabels: currentSnapshot.eventLabels,
  };
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
        index === 0 ? startLabel : format(date, 'MMM yyyy', { locale: getDateFnsLocale(language) }),
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
