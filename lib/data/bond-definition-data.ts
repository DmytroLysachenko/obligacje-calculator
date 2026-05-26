import { cache } from 'react';
import { differenceInDays } from 'date-fns';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { bondSeries, taxRules, type BondSeries, type PolishBond } from '@/db/schema';
import { BondDefinition, BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType, InterestPayout } from '@/features/bond-core/types';
import { getCached, setCache } from './market-data-cache';

function parseNumeric(value: string | null | undefined, fallback: number) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildActiveSeriesMap(series: BondSeries[], asOfDate: string) {
  return series.reduce<Record<string, BondSeries>>((acc, item) => {
    if (item.sellStartDate > asOfDate) {
      return acc;
    }

    const existing = acc[item.bondTypeId];
    if (!existing || existing.emissionMonth < item.emissionMonth) {
      acc[item.bondTypeId] = item;
    }

    return acc;
  }, {});
}

function shouldPreferBootstrapFirstPeriodRate(bond: PolishBond, symbol: BondType) {
  return bond.interestType === 'floating_nbp' &&
    (symbol === BondType.ROR || symbol === BondType.DOR);
}

function isBondOfferFresh(updatedAt?: Date | null) {
  if (!updatedAt) {
    return false;
  }

  return differenceInDays(new Date(), updatedAt) <= 45;
}

export function mergeBondDefinitionsWithSeries(
  bonds: PolishBond[],
  series: BondSeries[],
  fallbackDefinitions: Record<BondType, BondDefinition>,
  asOfDate = new Date().toISOString().slice(0, 10),
): BondDefinition[] {
  if (bonds.length === 0) {
    return Object.values(fallbackDefinitions);
  }

  const activeSeriesByBondTypeId = buildActiveSeriesMap(series, asOfDate);

  return bonds.map((bond) => {
    const symbol = bond.symbol as BondType;
    const bootstrap = fallbackDefinitions[symbol];
    const activeSeries = activeSeriesByBondTypeId[bond.id];
    const useDatabaseFallback = isBondOfferFresh(bond.updatedAt);
    const fallbackFirstYearRate = useDatabaseFallback
      ? parseNumeric(bond.firstYearRate, bootstrap.firstYearRate)
      : bootstrap.firstYearRate;
    const fallbackMargin = useDatabaseFallback
      ? parseNumeric(bond.baseMargin, bootstrap.margin)
      : bootstrap.margin;

    return {
      type: symbol,
      name: bond.symbol,
      fullName: {
        pl: bond.fullName || bootstrap.fullName.pl,
        en: bond.fullNameEn || bond.fullName || bootstrap.fullName.en,
      },
      description: {
        pl: bond.description || bootstrap.description.pl,
        en: bond.descriptionEn || bootstrap.description.en,
      },
      duration: bond.durationDays ? bond.durationDays / 365 : bootstrap.duration,
      nominalValue: parseNumeric(bond.nominalValue, bootstrap.nominalValue),
      isCapitalized:
        bond.capitalizationFreqDays === null || bond.capitalizationFreqDays === undefined
          ? bootstrap.isCapitalized
          : bond.capitalizationFreqDays > 0,
      payoutFrequency:
        (bond.payoutFreqDays || 0) === 30
          ? InterestPayout.MONTHLY
          : (bond.payoutFreqDays || 0) === 365
            ? InterestPayout.YEARLY
            : InterestPayout.MATURITY,
      firstYearRate: activeSeries
        ? parseNumeric(activeSeries.firstYearRate, bootstrap.firstYearRate)
        : shouldPreferBootstrapFirstPeriodRate(bond, symbol)
          ? bootstrap.firstYearRate
          : fallbackFirstYearRate,
      margin: activeSeries
        ? parseNumeric(activeSeries.baseMargin, bootstrap.margin)
        : fallbackMargin,
      earlyWithdrawalFee: parseNumeric(bond.withdrawalFee, bootstrap.earlyWithdrawalFee),
      isInflationIndexed:
        bond.interestType === 'inflation_linked'
          ? true
          : bond.interestType === 'floating_nbp'
            ? false
            : bootstrap.isInflationIndexed,
      isFloating:
        bond.interestType === 'floating_nbp'
          ? true
          : bond.interestType === 'inflation_linked'
            ? false
            : bootstrap.isFloating,
      isFamilyOnly: bond.isFamilyOnly ?? bootstrap.isFamilyOnly ?? false,
      rebuyDiscount: parseNumeric(bond.rolloverDiscount, bootstrap.rebuyDiscount),
    };
  });
}

export const getBondDefinitions = cache(async (): Promise<BondDefinition[]> => {
  const cacheKey = 'bond-definitions';
  const cached = getCached<BondDefinition[]>(cacheKey);
  if (cached) return cached;

  const [bonds, series] = await Promise.all([
    db.query.polishBonds.findMany(),
    db.query.bondSeries.findMany({
      orderBy: [desc(bondSeries.emissionMonth)],
    }),
  ]);

  if (bonds.length === 0) {
    return Object.values(BOND_DEFINITIONS);
  }

  const result = mergeBondDefinitionsWithSeries(bonds, series, BOND_DEFINITIONS);
  setCache(cacheKey, result);
  return result;
});

export const getBondDefinitionsMap = cache(async (): Promise<Record<BondType, BondDefinition>> => {
  const defs = await getBondDefinitions();
  return defs.reduce((acc, def) => {
    acc[def.type] = def;
    return acc;
  }, {} as Record<BondType, BondDefinition>);
});

export const getTaxRulesForYear = cache(async (year: number) => {
  const cacheKey = `tax-rules-${year}`;
  const cached = getCached<typeof taxRules.$inferSelect>(cacheKey);
  if (cached) return cached;

  const rules = await db.query.taxRules.findFirst({
    where: eq(taxRules.year, year),
  });

  if (!rules) {
    return db.query.taxRules.findFirst({
      orderBy: [desc(taxRules.year)],
    });
  }

  setCache(cacheKey, rules);
  return rules;
});
