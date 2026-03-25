import { Decimal } from 'decimal.js';

export function getExpectedInflationForYearIndex(
  expectedInflation: number,
  customInflation: number[] | undefined,
  yearIndex: number,
): number {
  if (customInflation && customInflation.length > yearIndex) {
    return customInflation[yearIndex];
  }

  return expectedInflation;
}

export function calculateCumulativeInflation(
  totalMonths: number,
  expectedInflation: number,
  customInflation?: number[],
): Decimal {
  let cumulativeInflation = new Decimal(1);

  for (let month = 1; month <= totalMonths; month++) {
    const yearIndex = Math.floor((month - 1) / 12);
    const inflation = getExpectedInflationForYearIndex(expectedInflation, customInflation, yearIndex);
    cumulativeInflation = cumulativeInflation.times(
      new Decimal(1).plus(new Decimal(inflation).dividedBy(12).dividedBy(100)),
    );
  }

  return cumulativeInflation;
}
