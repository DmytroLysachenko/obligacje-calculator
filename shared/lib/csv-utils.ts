import { YearlyTimelinePoint, LotBreakdown } from '@/features/bond-core/types';
import { AppLanguage, buildBondTimelineDisplayRows } from '@/shared/lib/bond-display';

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
    { key: 'cycleLabel', header: language === 'pl' ? 'Cykl' : 'Cycle' },
    { key: 'cadenceLabel', header: language === 'pl' ? 'Znaczenie' : 'Meaning' },
    {
      key: 'valueMeaningLabel',
      header: language === 'pl' ? 'Jak czytac ten wiersz' : 'How to read this row',
    },
    { key: 'interestRateLabel', header: headers.rate || 'Rate' },
    { key: 'rateSourceLabel', header: language === 'pl' ? 'Zrodlo stopy' : 'Rate source' },
    { key: 'referenceLabel', header: language === 'pl' ? 'Kontekst stopy' : 'Rate context' },
    {
      key: 'projectionLabel',
      header: language === 'pl' ? 'Tryb danych' : 'Data mode',
    },
    { key: 'principalValue', header: language === 'pl' ? 'Kapital w obligacji' : 'Bond principal value' },
    { key: 'paidOutCash', header: language === 'pl' ? 'Wyplacona gotowka' : 'Cash paid out' },
    { key: 'totalWealth', header: language === 'pl' ? 'Majatek laczny' : 'Total wealth' },
    { key: 'netProfit', header: language === 'pl' ? 'Zysk netto' : 'Net profit' },
    { key: 'realValue', header: headers.realValue || 'Real value' },
    {
      key: 'earlyExitValue',
      header: language === 'pl' ? 'Wyplata przy wczesniejszym wyjsciu' : 'Early exit payout',
    },
    { key: 'eventLabels', header: language === 'pl' ? 'Zdarzenia' : 'Events' },
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
