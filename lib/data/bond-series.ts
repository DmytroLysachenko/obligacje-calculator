import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { bondSeries, polishBonds } from '@/db/schema';

export async function getAllBondSeries() {
  return db.query.bondSeries.findMany();
}

export async function getBondSeriesBySymbol(symbol: string) {
  const bondType = await db.query.polishBonds.findFirst({
    where: eq(polishBonds.symbol, symbol),
  });

  if (!bondType) {
    return [];
  }

  return db.query.bondSeries.findMany({
    where: eq(bondSeries.bondTypeId, bondType.id),
    orderBy: [desc(bondSeries.emissionMonth)],
  });
}
