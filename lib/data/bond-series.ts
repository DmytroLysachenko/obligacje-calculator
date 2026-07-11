import { desc, eq } from 'drizzle-orm';

import { db, isDatabaseConfigured } from '@/db';
import { bondSeries, polishBonds } from '@/db/schema';

export async function getAllBondSeries() {
  if (!isDatabaseConfigured || process.env.PLAYWRIGHT_SMOKE === '1') {
    return [];
  }

  try {
    return await db.query.bondSeries.findMany();
  } catch {
    return [];
  }
}

export async function getBondSeriesBySymbol(symbol: string) {
  if (!isDatabaseConfigured || process.env.PLAYWRIGHT_SMOKE === '1') {
    return [];
  }

  try {
    const bondType = await db.query.polishBonds.findFirst({
      where: eq(polishBonds.symbol, symbol),
    });

    if (!bondType) {
      return [];
    }

    return await db.query.bondSeries.findMany({
      where: eq(bondSeries.bondTypeId, bondType.id),
      orderBy: [desc(bondSeries.emissionMonth)],
    });
  } catch {
    return [];
  }
}
