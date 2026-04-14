export interface TaxWrapperLimit {
  year: number;
  ike: number;
  ikze: number;
}

export const TAX_WRAPPER_LIMITS: TaxWrapperLimit[] = [
  { year: 2023, ike: 20805, ikze: 8322 },
  { year: 2024, ike: 23472, ikze: 9388.80 },
  { year: 2025, ike: 24324, ikze: 9730.80 },
  { year: 2026, ike: 25400, ikze: 10160 },
];

export function getLimitForYear(year: number): TaxWrapperLimit | undefined {
  return TAX_WRAPPER_LIMITS.find(l => l.year === year) || TAX_WRAPPER_LIMITS[TAX_WRAPPER_LIMITS.length - 1];
}
