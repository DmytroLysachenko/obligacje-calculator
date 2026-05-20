import { tx } from '@/i18n';

type Language = 'pl' | 'en';

type PluralForms = {
  one: string;
  few?: string;
  many: string;
};

function resolvePluralLabel(count: number, forms: PluralForms, language: Language) {
  if (language === 'en') {
    return count === 1 ? forms.one : forms.many;
  }

  if (count === 1) {
    return forms.one;
  }

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (forms.few && mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return forms.few;
  }

  return forms.many;
}

export function formatBondDuration(durationYears: number, language: Language): string {
  const monthForms = tx<PluralForms>('shared.format.duration_month_forms', undefined, language);
  const yearForms = tx<PluralForms>('shared.format.duration_year_forms', undefined, language);

  if (durationYears < 1) {
    const months = Math.round(durationYears * 12);
    return `${months} ${resolvePluralLabel(months, monthForms, language)}`;
  }

  const roundedYears = Number.isInteger(durationYears)
    ? durationYears.toFixed(0)
    : durationYears.toFixed(2).replace(/\.?0+$/, '');
  const numericYears = Number(roundedYears);

  return `${roundedYears} ${resolvePluralLabel(numericYears, yearForms, language)}`;
}
