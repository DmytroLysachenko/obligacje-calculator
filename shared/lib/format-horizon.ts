import { t } from '@/i18n';

type Language = 'pl' | 'en';

export function formatHorizonMonths(months: number, language: Language): string {
  const roundedMonths = Math.max(1, Math.round(months));

  if (roundedMonths < 12) {
    return t('shared.format.horizon_months', {count: roundedMonths}, language);
  }

  if (roundedMonths % 12 === 0) {
    const years = roundedMonths / 12;
    return t('shared.format.horizon_years', {count: years}, language);
  }

  return t('shared.format.horizon_months', {count: roundedMonths}, language);
}
