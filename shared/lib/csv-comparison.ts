import { YearlyTimelinePoint } from '@/features/bond-core/types';
import { translateMessage } from '@/i18n/translate';
import { AppLanguage, buildBondTimelineDisplayRows } from '@/shared/lib/bond-display';

import { CSV_SEPARATOR, formatCsvValue, formatExportDate } from './csv-format';

type ComparisonDisplayRow = ReturnType<typeof buildBondTimelineDisplayRows>[number];

interface ComparisonCsvRow {
  date: string;
  periodLabel: string;
  rowA?: ComparisonDisplayRow;
  rowB?: ComparisonDisplayRow;
}

function getComparisonCashFlowHeader(
  row: ComparisonDisplayRow | undefined,
  scenarioLabel: string,
  fallback: string | undefined,
  defaultLabel: string,
) {
  return row?.cashFlowLabel ? `${scenarioLabel} ${row.cashFlowLabel}` : (fallback ?? defaultLabel);
}

function mergeComparisonRows(
  timeline: YearlyTimelinePoint[],
  rows: ComparisonDisplayRow[],
  assign: (entry: ComparisonCsvRow, row: ComparisonDisplayRow) => void,
) {
  const rowMap = new Map<string, ComparisonCsvRow>();

  for (const [index, row] of rows.entries()) {
    const date = formatExportDate(timeline[index]?.cycleEndDate);
    const existing = rowMap.get(date) ?? {
      date,
      periodLabel: row.periodLabel,
    };
    assign(existing, row);
    existing.periodLabel = existing.periodLabel || row.periodLabel;
    rowMap.set(date, existing);
  }

  return rowMap;
}

function getComparisonLeader(
  rowA: ComparisonDisplayRow | undefined,
  rowB: ComparisonDisplayRow | undefined,
  language: AppLanguage,
) {
  if (rowA && rowB) {
    if (rowA.totalWealth === rowB.totalWealth) {
      return translateMessage(language, 'comparison.tie');
    }

    return rowA.totalWealth > rowB.totalWealth
      ? translateMessage(language, 'comparison.scenario_a')
      : translateMessage(language, 'comparison.scenario_b');
  }

  if (rowA) {
    return translateMessage(language, 'comparison.scenario_a');
  }

  return rowB ? translateMessage(language, 'comparison.scenario_b') : '';
}

function getRateDescription(row: ComparisonDisplayRow | undefined) {
  return [row?.interestRateLabel, row?.rateSourceLabel, row?.referenceLabel]
    .filter(Boolean)
    .join(' | ');
}

export function convertComparisonToCSV(
  timelineA: YearlyTimelinePoint[],
  timelineB: YearlyTimelinePoint[],
  headers: Record<string, string>,
  language: AppLanguage = 'pl',
) {
  const rowsA = buildBondTimelineDisplayRows(timelineA, language);
  const rowsB = buildBondTimelineDisplayRows(timelineB, language);
  const csvRows: string[] = [];
  const scenarioALabel = translateMessage(language, 'comparison.scenario_a');
  const scenarioBLabel = translateMessage(language, 'comparison.scenario_b');
  const cashFlowHeaderA = getComparisonCashFlowHeader(
    rowsA[0],
    scenarioALabel,
    headers.cashPaidA,
    'Scenario A cash paid out',
  );
  const cashFlowHeaderB = getComparisonCashFlowHeader(
    rowsB[0],
    scenarioBLabel,
    headers.cashPaidB,
    'Scenario B cash paid out',
  );
  const columns = [
    { key: 'date', header: headers.date || 'Date' },
    { key: 'periodLabel', header: headers.period || 'Period' },
    { key: 'cycleA', header: headers.cycleA || 'Scenario A cycle' },
    { key: 'cycleB', header: headers.cycleB || 'Scenario B cycle' },
    { key: 'cadenceA', header: headers.cadenceA || 'Scenario A meaning' },
    { key: 'cadenceB', header: headers.cadenceB || 'Scenario B meaning' },
    { key: 'scenarioA', header: headers.scenarioA || 'Scenario A total wealth' },
    { key: 'scenarioB', header: headers.scenarioB || 'Scenario B total wealth' },
    { key: 'realValueA', header: headers.realValueA || 'Scenario A real value' },
    { key: 'realValueB', header: headers.realValueB || 'Scenario B real value' },
    { key: 'cashPaidA', header: headers.cashPaidA || cashFlowHeaderA },
    { key: 'cashPaidB', header: headers.cashPaidB || cashFlowHeaderB },
    { key: 'leader', header: headers.leader || 'Ahead in this row' },
    { key: 'netProfitA', header: headers.netProfitA || 'Scenario A net profit' },
    { key: 'netProfitB', header: headers.netProfitB || 'Scenario B net profit' },
    { key: 'projectionA', header: headers.projectionA || 'Scenario A mode' },
    { key: 'projectionB', header: headers.projectionB || 'Scenario B mode' },
    { key: 'rateA', header: headers.rateA || 'Scenario A rate source' },
    { key: 'rateB', header: headers.rateB || 'Scenario B rate source' },
    { key: 'eventsA', header: headers.eventsA || 'Scenario A events' },
    { key: 'eventsB', header: headers.eventsB || 'Scenario B events' },
  ];
  csvRows.push(columns.map((column) => column.header).join(CSV_SEPARATOR));

  const rowMap = mergeComparisonRows(timelineA, rowsA, (entry, row) => {
    entry.rowA = row;
  });
  for (const [date, entry] of mergeComparisonRows(timelineB, rowsB, (target, row) => {
    target.rowB = row;
  })) {
    const existing = rowMap.get(date);
    if (existing) {
      existing.rowB = entry.rowB;
      existing.periodLabel = existing.periodLabel || entry.periodLabel;
    } else {
      rowMap.set(date, entry);
    }
  }

  const sortedRows = Array.from(rowMap.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  for (const entry of sortedRows) {
    const rowA = entry.rowA;
    const rowB = entry.rowB;
    const row = [
      formatCsvValue(entry.date, language),
      formatCsvValue(entry.periodLabel, language),
      formatCsvValue(rowA?.cycleLabel ?? '', language),
      formatCsvValue(rowB?.cycleLabel ?? '', language),
      formatCsvValue(rowA?.cadenceLabel ?? '', language),
      formatCsvValue(rowB?.cadenceLabel ?? '', language),
      formatCsvValue(rowA?.totalWealth ?? '', language),
      formatCsvValue(rowB?.totalWealth ?? '', language),
      formatCsvValue(rowA?.realValue ?? '', language),
      formatCsvValue(rowB?.realValue ?? '', language),
      formatCsvValue(rowA?.paidOutCash ?? '', language),
      formatCsvValue(rowB?.paidOutCash ?? '', language),
      formatCsvValue(getComparisonLeader(rowA, rowB, language), language),
      formatCsvValue(rowA?.netProfit ?? '', language),
      formatCsvValue(rowB?.netProfit ?? '', language),
      formatCsvValue(rowA?.projectionLabel ?? '', language),
      formatCsvValue(rowB?.projectionLabel ?? '', language),
      formatCsvValue(getRateDescription(rowA), language),
      formatCsvValue(getRateDescription(rowB), language),
      formatCsvValue(rowA?.eventLabels ?? [], language),
      formatCsvValue(rowB?.eventLabels ?? [], language),
    ];
    csvRows.push(row.join(CSV_SEPARATOR));
  }
  return csvRows.join('\r\n');
}
