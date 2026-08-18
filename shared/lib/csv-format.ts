import { AppLanguage } from '@/shared/lib/bond-display';
import { createNumberFormatter } from '@/shared/lib/formatters';

export const CSV_SEPARATOR = ';';

export function formatExportDate(value: string | undefined) {
  if (!value) {
    return '';
  }

  return value.includes('T') ? value.split('T')[0] : value;
}

export function formatCsvValue(value: unknown, language: AppLanguage) {
  if (typeof value === 'number') {
    return createNumberFormatter(language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    }).format(value);
  }

  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).replace(/"/g, '""')).join(', ');
    return `"${joined}"`;
  }

  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
