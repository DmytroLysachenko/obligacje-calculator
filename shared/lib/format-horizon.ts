import { translateMessage } from '@/i18n/translate';

type Language = 'pl' | 'en';

export function formatHorizonMonths(months: number, language: Language): string {
  const roundedMonths = Math.max(1, Math.round(months));

  if (roundedMonths < 12) {
    return translateMessage(language, 'shared.format.horizon_months', {count: roundedMonths});
  }

  if (roundedMonths % 12 === 0) {
    const years = roundedMonths / 12;
    return translateMessage(language, 'shared.format.horizon_years', {count: years});
  }

  return translateMessage(language, 'shared.format.horizon_months', {count: roundedMonths});
}
