import { YearlyTimelinePoint, LotBreakdown } from '@/features/bond-core/types';
import { AppLanguage, buildBondTimelineDisplayRows } from '@/shared/lib/bond-display';
import { t } from '@/i18n';

/**
 * Downloads a string as a file in the browser.
 * Adds BOM for proper UTF-8 detection in Excel.
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const anchor = document.createElement('a');
  const file = new Blob([`\ufeff${content}`], { type: contentType });
  anchor.href = URL.createObjectURL(file);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export function downloadJsonFile(payload: unknown, fileName: string) {
  const anchor = document.createElement('a');
  const file = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  anchor.href = URL.createObjectURL(file);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

const SEPARATOR = ';';

function formatCsvValue(
  value: unknown,
  language: AppLanguage,
) {
  if (typeof value === 'number') {
    return value.toLocaleString(language === 'pl' ? 'pl-PL' : 'en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    });
  }

  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).replace(/"/g, '""')).join(', ');
    return `"${joined}"`;
  }

  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/**
 * Converts a timeline to a CSV string.
 * Uses display rows instead of raw engine rows so exports match the UI.
 * Uses semicolon as separator for better compatibility with Polish Excel.
 */
export function convertTimelineToCSV(
  timeline: YearlyTimelinePoint[],
  headers: Record<string, string>,
  language: AppLanguage = 'pl',
): string {
  const csvRows: string[] = [];
  const displayRows = buildBondTimelineDisplayRows(timeline, language);
  const columns = [
    { key: 'periodLabel', header: headers.period || 'Period' },
    { key: 'cycleLabel', header: headers.cycle || t('bonds.cycle', undefined, language) },
    { key: 'cadenceLabel', header: headers.cadence || t('common.meaning', undefined, language) },
    {
      key: 'valueMeaningLabel',
      header: headers.meaning || 'Meaning',
    },
    { key: 'interestRateLabel', header: headers.rate || 'Rate' },
    { key: 'rateSourceLabel', header: headers.rateSource || 'Rate source' },
    { key: 'referenceLabel', header: headers.reference || 'Rate context' },
    {
      key: 'projectionLabel',
      header: headers.projection || 'Data mode',
    },
    { key: 'principalValue', header: headers.principalValue || 'Bond principal value' },
    { key: 'paidOutCash', header: headers.paidOutCash || 'Cash paid out' },
    { key: 'totalWealth', header: headers.totalWealth || 'Total wealth' },
    { key: 'netProfit', header: headers.netProfit || 'Net profit' },
    { key: 'realValue', header: headers.realValue || 'Real value' },
    {
      key: 'earlyExitValue',
      header: headers.earlyExitValue || 'Early exit payout',
    },
    { key: 'eventLabels', header: headers.events || t('common.events', undefined, language) },
  ];

  csvRows.push(columns.map((column) => column.header).join(SEPARATOR));

  for (const point of displayRows) {
    const row = columns.map((column) =>
      formatCsvValue(
        (point as unknown as Record<string, unknown>)[column.key],
        language,
      ),
    );
    csvRows.push(row.join(SEPARATOR));
  }

  return csvRows.join('\r\n');
}

/**
 * Converts investment lots to a CSV string.
 */
export function convertLotsToCSV(
  lots: LotBreakdown[],
  headers: Record<string, string>,
  language: AppLanguage = 'pl',
): string {
  const csvRows: string[] = [];
  const columns = [
    { key: 'purchaseDate', header: headers.purchaseDate || 'Purchase Date' },
    { key: 'maturityDate', header: headers.maturityDate || 'Maturity Date' },
    { key: 'investedAmount', header: headers.invested || 'Invested' },
    { key: 'accumulatedInterest', header: headers.interest || 'Interest' },
    { key: 'tax', header: headers.tax || 'Tax' },
    { key: 'earlyWithdrawalFee', header: headers.fee || 'Fee' },
    { key: 'netValue', header: headers.netValue || 'Net Value' },
  ];

  csvRows.push(columns.map((column) => column.header).join(SEPARATOR));

  for (const lot of lots) {
    const row = columns.map((column) => {
      const value = (lot as unknown as Record<string, unknown>)[column.key];

      if (typeof value === 'string' && value.includes('T')) {
        return `"${value.split('T')[0]}"`;
      }

      return formatCsvValue(value, language);
    });
    csvRows.push(row.join(SEPARATOR));
  }

  return csvRows.join('\r\n');
}

export function convertComparisonToCSV(
  timelineA: YearlyTimelinePoint[],
  timelineB: YearlyTimelinePoint[],
  headers: Record<string, string>,
  language: AppLanguage = 'pl',
) {
  const rowsA = buildBondTimelineDisplayRows(timelineA, language);
  const rowsB = buildBondTimelineDisplayRows(timelineB, language);
  const rowCount = Math.max(rowsA.length, rowsB.length);
  const csvRows: string[] = [];
  const columns = [
    { key: 'periodLabel', header: headers.period || 'Period' },
    { key: 'scenarioA', header: headers.scenarioA || 'Scenario A total wealth' },
    { key: 'scenarioB', header: headers.scenarioB || 'Scenario B total wealth' },
    { key: 'leader', header: headers.leader || 'Ahead in this row' },
    { key: 'netProfitA', header: headers.netProfitA || 'Scenario A net profit' },
    { key: 'netProfitB', header: headers.netProfitB || 'Scenario B net profit' },
    { key: 'projectionA', header: headers.projectionA || 'Scenario A mode' },
    { key: 'projectionB', header: headers.projectionB || 'Scenario B mode' },
  ];

  csvRows.push(columns.map((column) => column.header).join(SEPARATOR));

  for (let index = 0; index < rowCount; index += 1) {
    const rowA = rowsA[index];
    const rowB = rowsB[index];
    const leader =
      rowA && rowB
        ? rowA.totalWealth === rowB.totalWealth
          ? t('comparison.tie', undefined, language)
          : rowA.totalWealth > rowB.totalWealth
            ? t('comparison.scenario_a', undefined, language)
            : t('comparison.scenario_b', undefined, language)
        : rowA
          ? t('comparison.scenario_a', undefined, language)
          : rowB
            ? t('comparison.scenario_b', undefined, language)
            : '';

    const row = [
      formatCsvValue(rowA?.periodLabel ?? rowB?.periodLabel ?? '', language),
      formatCsvValue(rowA?.totalWealth ?? '', language),
      formatCsvValue(rowB?.totalWealth ?? '', language),
      formatCsvValue(leader, language),
      formatCsvValue(rowA?.netProfit ?? '', language),
      formatCsvValue(rowB?.netProfit ?? '', language),
      formatCsvValue(rowA?.projectionLabel ?? '', language),
      formatCsvValue(rowB?.projectionLabel ?? '', language),
    ];
    csvRows.push(row.join(SEPARATOR));
  }

  return csvRows.join('\r\n');
}
