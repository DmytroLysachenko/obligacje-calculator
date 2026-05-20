import { t } from '@/i18n';

type Language = 'pl' | 'en';

export function formatBondDuration(durationYears: number, language: Language): string {
  if (durationYears < 1) {
    const months = Math.round(durationYears * 12);
    return t('shared.format.duration_months', {count: months}, language);
  }

  const roundedYears = Number.isInteger(durationYears)
    ? durationYears.toFixed(0)
    : durationYears.toFixed(2).replace(/\.?0+$/, '');

  return t('shared.format.duration_years', {count: Number(roundedYears)}, language);
}
