import {db} from '../index';
import {dataSeries} from '../schema';

const baseSeries = [
  {
    slug: 'pl-cpi',
    name: 'Poland Consumer Price Index (Inflation)',
    description: 'Monthly inflation rate (CPI) from GUS/GWP.',
    category: 'macro' as const,
    unit: '%',
    frequency: 'monthly',
    displayPrecision: 2,
    dataSource: 'GUS official CPI monthly archive CSV',
  },
  {
    slug: 'nbp-ref-rate',
    name: 'NBP Reference Rate',
    description: 'Main interest rate set by the National Bank of Poland.',
    category: 'macro' as const,
    unit: '%',
    frequency: 'irregular',
    displayPrecision: 2,
    dataSource: 'NBP',
  },
  {
    slug: 'sp500',
    name: 'S&P 500 Index',
    description: "Standard & Poor's 500 stock market index.",
    category: 'index' as const,
    unit: 'USD',
    frequency: 'monthly',
    displayPrecision: 2,
    dataSource: 'Yahoo Finance',
  },
  {
    slug: 'gold-price',
    name: 'Gold Price (XAU/PLN)',
    description: 'Price of gold in Polish Zloty.',
    category: 'instrument' as const,
    unit: 'PLN',
    frequency: 'daily',
    displayPrecision: 2,
    dataSource: 'NBP',
  },
] as const;

export async function seedSeriesMetadata() {
  let seriesCount = 0;

  for (const series of baseSeries) {
    await db.insert(dataSeries).values(series).onConflictDoUpdate({
      target: dataSeries.slug,
      set: {...series, updatedAt: new Date()},
    });
    seriesCount++;
  }

  return seriesCount;
}
