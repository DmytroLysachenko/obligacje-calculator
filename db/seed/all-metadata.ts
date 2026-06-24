import { db } from '../index';
import { dataSeries, polishBonds } from '../schema';
import { BOND_DEFINITIONS } from '../../features/bond-core/constants/bond-definitions';
import { InterestPayout } from '../../features/bond-core/types';
import { seedTaxRules } from './tax-rules';

const metadataSeries = [
  {
    slug: 'sp500',
    name: 'S&P 500 Index',
    category: 'index' as const,
    unit: 'points',
    frequency: 'daily',
    dataSource: 'Yahoo Finance',
  },
  {
    slug: 'gold-usd',
    name: 'Gold Price (USD)',
    category: 'commodity' as const,
    unit: 'USD/oz',
    frequency: 'daily',
    dataSource: 'Yahoo Finance',
  },
  {
    slug: 'wibor-3m',
    name: 'WIBOR 3M',
    category: 'macro' as const,
    unit: '%',
    frequency: 'daily',
    dataSource: 'GPW Benchmark historical access required',
  },
  {
    slug: 'wibor-6m',
    name: 'WIBOR 6M',
    category: 'macro' as const,
    unit: '%',
    frequency: 'daily',
    dataSource: 'GPW Benchmark historical access required',
  },
  {
    slug: 'pl-cpi',
    name: 'Poland Inflation (CPI)',
    category: 'macro' as const,
    unit: '%',
    frequency: 'monthly',
    dataSource: 'GUS official CPI monthly archive CSV',
  },
  {
    slug: 'nbp-ref-rate',
    name: 'NBP Reference Rate',
    category: 'macro' as const,
    unit: '%',
    frequency: 'on-event',
    dataSource: 'NBP',
  },
] as const;

export async function seedAllMetadata() {
  for (const [symbol, definition] of Object.entries(BOND_DEFINITIONS)) {
    const interestType = definition.isInflationIndexed
      ? 'inflation_linked'
      : definition.isFloating
        ? 'floating_nbp'
        : 'fixed';
    const capitalizationFrequencyDays = definition.isCapitalized ? 365 : 0;
    const payoutFrequencyDays =
      definition.payoutFrequency === InterestPayout.MONTHLY
        ? 30
        : definition.payoutFrequency === InterestPayout.YEARLY
          ? 365
          : 0;

    await db
      .insert(polishBonds)
      .values({
        symbol,
        fullName: definition.fullName.pl,
        fullNameEn: definition.fullName.en,
        description: definition.description.pl,
        descriptionEn: definition.description.en,
        durationDays: Math.round(definition.duration * 365),
        nominalValue: definition.nominalValue.toString(),
        capitalizationFreqDays: capitalizationFrequencyDays,
        payoutFreqDays: payoutFrequencyDays,
        interestType: interestType as 'fixed' | 'floating_nbp' | 'inflation_linked',
        firstYearRate: definition.firstYearRate.toString(),
        baseMargin: definition.margin.toString(),
        withdrawalFee: definition.earlyWithdrawalFee.toString(),
        withdrawalFeeCap: true,
        rolloverDiscount: definition.rebuyDiscount.toString(),
        isFamilyOnly: definition.isFamilyOnly || false,
      })
      .onConflictDoUpdate({
        target: polishBonds.symbol,
        set: {
          fullName: definition.fullName.pl,
          fullNameEn: definition.fullName.en,
          description: definition.description.pl,
          descriptionEn: definition.description.en,
          durationDays: Math.round(definition.duration * 365),
          firstYearRate: definition.firstYearRate.toString(),
          baseMargin: definition.margin.toString(),
          withdrawalFee: definition.earlyWithdrawalFee.toString(),
          rolloverDiscount: definition.rebuyDiscount.toString(),
        },
      });
  }

  await seedTaxRules();

  for (const series of metadataSeries) {
    await db
      .insert(dataSeries)
      .values(series)
      .onConflictDoUpdate({
        target: dataSeries.slug,
        set: {
          name: series.name,
          category: series.category,
          unit: series.unit,
          frequency: series.frequency,
          dataSource: series.dataSource,
        },
      });
  }
}
