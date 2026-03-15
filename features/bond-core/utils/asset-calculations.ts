import { HISTORICAL_RETURNS, MonthlyReturn } from '../constants/historical-data';

export interface AssetResult {
  date: string;
  nominalValue: number;
  realValue: number;
  drawdown: number; // % from peak
}

export interface MultiAssetComparison {
  sp500: AssetResult[];
  gold: AssetResult[];
  savings: AssetResult[];
  benchmarkBond: AssetResult[]; // We can use a representative bond like EDO
}

/**
 * Calculates the growth of an initial sum based on a stream of percentage returns.
 */
export function calculateAssetGrowth(
  initialSum: number,
  returnKey: keyof Omit<MonthlyReturn, 'date'>,
  data: MonthlyReturn[] = HISTORICAL_RETURNS
): AssetResult[] {
  const results: AssetResult[] = [];
  let currentValue = initialSum;
  let peakValue = initialSum;
  let cumulativeInflation = 1;

  // Add initial point
  results.push({
    date: data[0].date,
    nominalValue: initialSum,
    realValue: initialSum,
    drawdown: 0
  });

  for (const row of data) {
    const monthlyReturn = row[returnKey] as number;
    const monthlyInflation = row.inflation;

    // Compound values
    currentValue *= (1 + monthlyReturn / 100);
    cumulativeInflation *= (1 + monthlyInflation / 100);

    // Calculate drawdown
    if (currentValue > peakValue) {
      peakValue = currentValue;
    }
    const drawdown = ((peakValue - currentValue) / peakValue) * 100;

    results.push({
      date: row.date,
      nominalValue: currentValue,
      realValue: currentValue / cumulativeInflation,
      drawdown
    });
  }

  return results;
}
