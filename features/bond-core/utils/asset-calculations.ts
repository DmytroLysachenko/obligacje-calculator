import { HISTORICAL_RETURNS, MonthlyReturn } from '../constants/historical-data';
import { AssetPerformanceSeries, DataPoint, AssetMetadata } from '../types/assets';

function sanitizePercent(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Universal calculation engine for any asset with a return stream.
 * Converts monthly % changes into a growth series with drawdown and inflation adjustment.
 */
export function calculateAssetPerformance(
  initialSum: number,
  monthlyContribution: number,
  returnKey: keyof Omit<MonthlyReturn, 'date'>,
  metadata: AssetMetadata,
  data: MonthlyReturn[] = HISTORICAL_RETURNS
): AssetPerformanceSeries {
  const series: DataPoint[] = [];
  let currentValue = initialSum;
  let peakValue = initialSum;
  let cumulativeInflation = 1;

  // Initial Point
  series.push({
    date: 'Start',
    value: initialSum,
    percentChange: 0,
    drawdown: 0,
    realValue: initialSum,
  });

  for (const row of data) {
    const monthlyReturn = sanitizePercent(row[returnKey] as number);
    const monthlyInflation = sanitizePercent(row.inflation);

    // 1. Add monthly contribution at start of month
    currentValue += monthlyContribution;

    // 2. Calculate Nominal Growth
    currentValue *= (1 + monthlyReturn / 100);
    
    // 3. Track Cumulative Inflation
    cumulativeInflation *= (1 + monthlyInflation / 100);

    // 4. Calculate Drawdown
    if (currentValue > peakValue) {
      peakValue = currentValue;
    }
    const drawdown = ((peakValue - currentValue) / peakValue) * 100;

    series.push({
      date: row.date,
      value: currentValue,
      percentChange: monthlyReturn,
      drawdown: sanitizePercent(drawdown),
      realValue: currentValue / cumulativeInflation,
    });
  }

  return {
    metadata,
    series,
  };
}

/**
 * Specialized calculation for Bonds (e.g. EDO) using historical inflation.
 */
export function calculateBondsPerformance(
  initialSum: number,
  monthlyContribution: number,
  metadata: AssetMetadata,
  data: MonthlyReturn[] = HISTORICAL_RETURNS,
  config = { firstYearRate: 6.8, margin: 2.0 }
): AssetPerformanceSeries {
  const series: DataPoint[] = [];
  let currentValue = initialSum;
  let peakValue = initialSum;
  let cumulativeInflation = 1;

  // Initial Point
  series.push({
    date: 'Start',
    value: initialSum,
    percentChange: 0,
    drawdown: 0,
    realValue: initialSum,
  });

  // Track each "lot" bought monthly to apply its own year-based rate
  const lots: { value: number; monthsHeld: number }[] = [{ value: initialSum, monthsHeld: 0 }];

  for (const row of data) {
    const monthlyInflation = sanitizePercent(row.inflation);
    cumulativeInflation *= (1 + monthlyInflation / 100);

    // Add new monthly contribution as a new lot
    if (monthlyContribution > 0) {
      lots.push({ value: monthlyContribution, monthsHeld: 0 });
    }

    let totalMonthValue = 0;
    for (const lot of lots) {
      const year = Math.floor(lot.monthsHeld / 12) + 1;
      const annualRate = year === 1 ? config.firstYearRate : (sanitizePercent(row.inflation) + config.margin);
      
      // Interpolate to monthly rate
      const monthlyRate = (Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100;
      
      lot.value *= (1 + monthlyRate / 100);
      lot.monthsHeld += 1;
      totalMonthValue += lot.value;
    }

    currentValue = totalMonthValue;

    if (currentValue > peakValue) {
      peakValue = currentValue;
    }
    const drawdown = ((peakValue - currentValue) / peakValue) * 100;

    series.push({
      date: row.date,
      value: currentValue,
      percentChange: 0, // Simplified
      drawdown: sanitizePercent(drawdown),
      realValue: currentValue / cumulativeInflation,
    });
  }

  return {
    metadata,
    series,
  };
}

/**
 * Specialized calculation for Savings Account using historical NBP rates.
 * Assumes monthly capitalization and Belka tax (19%).
 */
export function calculateSavingsPerformance(
  initialSum: number,
  monthlyContribution: number,
  metadata: AssetMetadata,
  data: MonthlyReturn[] = HISTORICAL_RETURNS,
  config = { nbpMargin: 1.0, taxRate: 19 }
): AssetPerformanceSeries {
  const series: DataPoint[] = [];
  let currentValue = initialSum;
  let peakValue = initialSum;
  let cumulativeInflation = 1;

  // Initial Point
  series.push({
    date: 'Start',
    value: initialSum,
    percentChange: 0,
    drawdown: 0,
    realValue: initialSum,
  });

  for (const row of data) {
    const monthlyInflation = sanitizePercent(row.inflation);
    cumulativeInflation *= (1 + monthlyInflation / 100);

    // 1. Add contribution
    currentValue += monthlyContribution;

    // 2. Calculate Interest based on NBP rate
    const annualRate = Math.max(0, sanitizePercent(row.nbpRate) + config.nbpMargin);
    const monthlyRate = (Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100;
    
    const grossInterest = currentValue * (monthlyRate / 100);
    const tax = grossInterest * (config.taxRate / 100);
    const netInterest = grossInterest - tax;
    
    currentValue += netInterest;

    // 3. Track Drawdown
    if (currentValue > peakValue) {
      peakValue = currentValue;
    }
    const drawdown = ((peakValue - currentValue) / peakValue) * 100;

    series.push({
      date: row.date,
      value: currentValue,
      percentChange: sanitizePercent(monthlyRate),
      drawdown: sanitizePercent(drawdown),
      realValue: currentValue / cumulativeInflation,
    });
  }

  return {
    metadata,
    series,
  };
}
