import { LotBreakdown, YearlyTimelinePoint } from '@/features/bond-core/types';
import { AppLanguage } from './bond-display';
import { convertLotsToCSV, convertTimelineToCSV, downloadFile } from './csv-utils';

type TranslateFn = (key: string) => string;

function todayStamp() {
  return new Date().toISOString().split('T')[0];
}

export function buildTimelineCsvFilename(
  scope: 'bond_simulation' | 'bond_comparison',
  bondType: string,
) {
  return `${scope}_${bondType}_${todayStamp()}.csv`;
}

export function buildLotsCsvFilename() {
  return `regular_investment_${todayStamp()}.csv`;
}

export function exportTimelineCsv(options: {
  timeline: YearlyTimelinePoint[];
  headers: Record<string, string>;
  language: AppLanguage;
  fileName: string;
}) {
  const csv = convertTimelineToCSV(options.timeline, options.headers, options.language);
  downloadFile(
    csv,
    options.fileName,
    'text/csv;charset=utf-8',
  );
}

export function exportLotsCsv(options: {
  lots: LotBreakdown[];
  headers: Record<string, string>;
  language: AppLanguage;
  fileName: string;
}) {
  const csv = convertLotsToCSV(options.lots, options.headers, options.language);
  downloadFile(
    csv,
    options.fileName,
    'text/csv;charset=utf-8',
  );
}

export function buildComparisonExportLabel(
  t: TranslateFn,
  language: AppLanguage,
  bondType: string,
) {
  return language === 'pl'
    ? `${t('comparison.export')} CSV (${bondType})`
    : `${t('comparison.export')} CSV (${bondType})`;
}
