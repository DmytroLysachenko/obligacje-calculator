import 'dotenv/config';
import { db } from './index';
import { dataSeries, polishBonds } from './schema';
import { BondType } from '../features/bond-core/types';
import { BOND_DEFINITIONS } from '../features/bond-core/constants/bond-definitions';

const SERIES = [
  {
    slug: 'pl-cpi',
    name: 'Poland Consumer Price Index (Inflation)',
    description: 'Monthly inflation rate (CPI) from GUS/GWP.',
    category: 'macro' as const,
    unit: '%',
    frequency: 'monthly',
    displayPrecision: 2,
    dataSource: 'GUS/WorldBank',
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
    description: 'Standard & Poor\'s 500 stock market index.',
    category: 'index' as const,
    unit: 'USD',
    frequency: 'monthly',
    displayPrecision: 2,
    dataSource: 'Stooq',
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
  }
];

async function seed() {
  console.log('--- Database Seeding Started ---');

  // 1. Seed Data Series (Metadata)
  console.log('Seeding data series metadata...');
  let seriesCount = 0;
  for (const s of SERIES) {
    await db.insert(dataSeries).values(s).onConflictDoUpdate({
      target: dataSeries.slug,
      set: { ...s, updatedAt: new Date() }
    });
    seriesCount++;
  }
  console.log(`Successfully seeded ${seriesCount} data series.`);

  // 2. Seed Polish Bonds Metadata
  console.log('Seeding polish bonds metadata...');
  let bondCount = 0;
  for (const bondType of Object.values(BondType)) {
    const def = BOND_DEFINITIONS[bondType];
    const interestType = def.isInflationIndexed 
      ? 'inflation_linked' 
      : (def.isFloating ? 'floating_nbp' : 'fixed');

    await db.insert(polishBonds).values({
      symbol: bondType,
      fullName: def.fullName.pl,
      durationDays: Math.round(def.duration * 365),
      nominalValue: '100.00',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interestType: interestType as any,
      firstYearRate: def.firstYearRate.toString(),
      baseMargin: def.margin.toString(),
      withdrawalFee: def.earlyWithdrawalFee.toString(),
      isFamilyOnly: bondType === BondType.ROS || bondType === BondType.ROD,
    }).onConflictDoUpdate({
      target: polishBonds.symbol,
      set: { 
        fullName: def.fullName.pl,
        firstYearRate: def.firstYearRate.toString(),
        baseMargin: def.margin.toString(),
        updatedAt: new Date()
      }
    });
    bondCount++;
  }
  console.log(`Successfully seeded ${bondCount} bond types.`);

  console.log('--- Database Seeding Complete ---');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
