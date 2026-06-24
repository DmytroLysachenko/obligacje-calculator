import { translateMessage } from '@/i18n/translate';

type Language = 'pl' | 'en';

export function formatBondDuration(durationYears: number, language: Language): string {
  if (durationYears < 1) {
    const months = Math.round(durationYears * 12);
    return translateMessage(language, 'shared.format.duration_months', { count: months });
  }

  const roundedYears = Number.isInteger(durationYears)
    ? durationYears.toFixed(0)
    : durationYears.toFixed(2).replace(/\.?0+$/, '');

  return translateMessage(language, 'shared.format.duration_years', {
    count: Number(roundedYears),
  });
}
