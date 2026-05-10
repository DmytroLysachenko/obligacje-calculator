export function formatHorizonMonths(
  months: number,
  language: 'pl' | 'en',
): string {
  const roundedMonths = Math.max(1, Math.round(months));

  if (roundedMonths < 12) {
    return language === 'pl'
      ? `${roundedMonths} ${pluralizePolishMonths(roundedMonths)}`
      : `${roundedMonths} ${roundedMonths === 1 ? 'month' : 'months'}`;
  }

  if (roundedMonths % 12 === 0) {
    const years = roundedMonths / 12;

    return language === 'pl'
      ? `${years} ${pluralizePolishYears(years)}`
      : `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  return language === 'pl'
    ? `${roundedMonths} ${pluralizePolishMonths(roundedMonths)}`
    : `${roundedMonths} ${roundedMonths === 1 ? 'month' : 'months'}`;
}

function pluralizePolishMonths(months: number): string {
  if (months === 1) {
    return 'miesiac';
  }

  const mod10 = months % 10;
  const mod100 = months % 100;

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'miesiace';
  }

  return 'miesiecy';
}

function pluralizePolishYears(years: number): string {
  if (years === 1) {
    return 'rok';
  }

  if (years >= 2 && years <= 4) {
    return 'lata';
  }

  return 'lat';
}
