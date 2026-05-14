import { YearlyTimelinePoint, LotBreakdown } from '@/features/bond-core/types';
import { AppLanguage, buildBondTimelineDisplayRows } from '@/shared/lib/bond-display';

/**
 * Downloads a string as a file in the browser.
 * Adds BOM for proper UTF-8 detection in Excel.
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement('a');
  const file = new Blob(['\ufeff' + content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

const SEPARATOR = ';';

/**
 * Converts a timeline to a CSV string.
 * Uses semicolon as separator for better compatibility with European Excel (Poland).
 */
export function convertTimelineToCSV(
  timeline: YearlyTimelinePoint[],
  headers: Record<string, string>,
  language: AppLanguage = 'pl',
): string {
  const csvRows = [];
  const displayRows = buildBondTimelineDisplayRows(timeline, language);
  const columns = [
    { key: 'periodLabel', header: headers.period || 'Period' },
    { key: 'cycleLabel', header: language === 'pl' ? 'Cykl' : 'Cycle' },
    { key: 'cadenceLabel', header: language === 'pl' ? 'Znaczenie' : 'Meaning' },
    { key: 'interestRateLabel', header: headers.rate || 'Rate' },
    { key: 'rateSourceLabel', header: language === 'pl' ? 'Źródło stopy' : 'Rate source' },
    { key: 'referenceLabel', header: language === 'pl' ? 'Kontekst stopy' : 'Rate context' },
    { key: 'nominalValue', header: headers.nominalValue || 'Nominal Value' },
    { key: 'netProfit', header: language === 'pl' ? 'Zysk netto' : 'Net profit' },
    { key: 'realValue', header: headers.realValue || 'Real Value' },
    { key: 'earlyExitValue', header: language === 'pl' ? 'Wypłata przy wcześniejszym wyjściu' : 'Early exit payout' },
    { key: 'eventLabels', header: language === 'pl' ? 'Zdarzenia' : 'Events' },
  ];

  // Header row
  csvRows.push(columns.map(c => c.header).join(SEPARATOR));

  // Data rows
  for (const point of displayRows) {
    const row = columns.map(c => {
      const val = (point as unknown as Record<string, unknown>)[c.key];
      if (typeof val === 'number') {
        return val.toFixed(2);
      }
      if (Array.isArray(val)) {
        return `"${val.join(', ')}"`;
      }
      return `"${String(val ?? '')}"`;
    });
    csvRows.push(row.join(SEPARATOR));
  }

  return csvRows.join('\r\n');
}

/**
 * Converts investment lots to a CSV string.
 */
export function convertLotsToCSV(
  lots: LotBreakdown[],
  headers: Record<string, string>
): string {
  const csvRows = [];
  
  const columns = [
    { key: 'purchaseDate', header: headers.purchaseDate || 'Purchase Date' },
    { key: 'maturityDate', header: headers.maturityDate || 'Maturity Date' },
    { key: 'investedAmount', header: headers.invested || 'Invested' },
    { key: 'accumulatedInterest', header: headers.interest || 'Interest' },
    { key: 'tax', header: headers.tax || 'Tax' },
    { key: 'earlyWithdrawalFee', header: headers.fee || 'Fee' },
    { key: 'netValue', header: headers.netValue || 'Net Value' },
  ];

  csvRows.push(columns.map(c => c.header).join(SEPARATOR));

  for (const lot of lots) {
    const row = columns.map(c => {
      const val = (lot as unknown as Record<string, unknown>)[c.key];
      if (typeof val === 'number') {
        return val.toFixed(2);
      }
      if (typeof val === 'string' && val.includes('T')) {
        return val.split('T')[0];
      }
      return `"${val}"`;
    });
    csvRows.push(row.join(SEPARATOR));
  }

  return csvRows.join('\r\n');
}
