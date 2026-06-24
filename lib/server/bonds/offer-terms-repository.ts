import {db} from '@/db';
import {bondSeries, polishBonds} from '@/db/schema';
import type {BondType} from '@/features/bond-core/types';
import {and, desc, eq, lte} from 'drizzle-orm';

export async function findBondDefinitionBySymbol(bondType: BondType) {
  return db.query.polishBonds.findFirst({
    where: eq(polishBonds.symbol, bondType),
  });
}

export async function findBondSeriesByIdForBond(seriesId: string, bondTypeId: string) {
  return db.query.bondSeries.findFirst({
    where: and(
      eq(bondSeries.id, seriesId),
      eq(bondSeries.bondTypeId, bondTypeId),
    ),
  });
}

export async function findActiveBondSeriesForDate(bondTypeId: string, purchaseDate: string) {
  return db.query.bondSeries.findFirst({
    where: and(
      eq(bondSeries.bondTypeId, bondTypeId),
      lte(bondSeries.emissionMonth, purchaseDate),
    ),
    orderBy: [desc(bondSeries.emissionMonth)],
  });
}

export async function updatePolishBondOfferTerms(
  bondType: BondType,
  offer: {
    firstYearRate: string;
    margin: string;
  },
) {
  await db
    .update(polishBonds)
    .set({
      firstYearRate: offer.firstYearRate,
      baseMargin: offer.margin,
      updatedAt: new Date(),
    })
    .where(eq(polishBonds.symbol, bondType));
}

export async function upsertBondSeriesOffer(offer: {
  bondTypeId: string;
  seriesCode: string;
  emissionMonth: string;
  sellStartDate: string;
  sellEndDate: string;
  maturityDate: string;
  firstYearRate: string;
  margin: string;
}) {
  await db
    .insert(bondSeries)
    .values({
      bondTypeId: offer.bondTypeId,
      seriesCode: offer.seriesCode,
      emissionMonth: offer.emissionMonth,
      sellStartDate: offer.sellStartDate,
      sellEndDate: offer.sellEndDate,
      maturityDate: offer.maturityDate,
      firstYearRate: offer.firstYearRate,
      baseMargin: offer.margin,
    })
    .onConflictDoUpdate({
      target: bondSeries.seriesCode,
      set: {
        firstYearRate: offer.firstYearRate,
        baseMargin: offer.margin,
        sellStartDate: offer.sellStartDate,
        sellEndDate: offer.sellEndDate,
        maturityDate: offer.maturityDate,
      },
    });
}
