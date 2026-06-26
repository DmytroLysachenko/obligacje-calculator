import { getIntlLocale } from '@/i18n/locale-utils';
import { AppLanguage } from '@/shared/lib/bond-display';

export const CSV_SEPARATOR = ';';

export function formatExportDate(value: string | undefined) {
  if (!value) {
    return '';
  }

  return value.includes('T') ? value.split('T')[0] : value;
}

export function formatCsvValue(value: unknown, language: AppLanguage) {
  if (typeof value === 'number') {
    return value.toLocaleString(getIntlLocale(language), {
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
