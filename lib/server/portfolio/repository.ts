import {db} from '@/db';
import {userInvestmentLots, userPortfolios, userTransactions, users} from '@/db/schema';
import {and, eq, inArray} from 'drizzle-orm';

export function listPortfoliosByOwner(ownerId: string) {
  return db.query.userPortfolios.findMany({
    where: eq(userPortfolios.userId, ownerId),
    orderBy: (portfolio, {desc}) => [desc(portfolio.updatedAt)],
  });
}

export function createPortfolio(ownerId: string, name: string, description?: string) {
  return db.insert(userPortfolios).values({
    userId: ownerId,
    name,
    description,
  }).returning();
}

export function findPortfolioByOwner(ownerId: string, portfolioId: string) {
  return db.query.userPortfolios.findFirst({
    where: and(eq(userPortfolios.id, portfolioId), eq(userPortfolios.userId, ownerId)),
  });
}

export function ensureGuestPortfolioOwner(ownerId: string) {
  return db
    .insert(users)
    .values({
      id: ownerId,
      name: 'Guest Notebook User',
    })
    .onConflictDoNothing();
}

export function findPortfolioById(portfolioId: string) {
  return db.query.userPortfolios.findFirst({
    where: eq(userPortfolios.id, portfolioId),
  });
}

export function findPortfolioByShareId(shareId: string) {
  return db.query.userPortfolios.findFirst({
    where: eq(userPortfolios.shareId, shareId),
  });
}

export function deletePortfolioById(portfolioId: string) {
  return db.delete(userPortfolios).where(eq(userPortfolios.id, portfolioId)).returning();
}

export function updatePortfolioVisibility(ownerId: string, portfolioId: string, isPublic: boolean) {
  return db
    .update(userPortfolios)
    .set({isPublic, updatedAt: new Date()})
    .where(and(eq(userPortfolios.id, portfolioId), eq(userPortfolios.userId, ownerId)));
}

export function listLotsByPortfolio(portfolioId: string) {
  return db.query.userInvestmentLots.findMany({
    where: eq(userInvestmentLots.portfolioId, portfolioId),
    orderBy: (lot, {desc}) => [desc(lot.purchaseDate)],
  });
}

export function listLotsByPortfolioIds(portfolioIds: string[]) {
  if (portfolioIds.length === 0) {
    return Promise.resolve([]);
  }

  return db.query.userInvestmentLots.findMany({
    where: inArray(userInvestmentLots.portfolioId, portfolioIds),
  });
}

export async function findOwnedLotByOwner(ownerId: string, lotId: string) {
  const [lot] = await db
    .select({
      id: userInvestmentLots.id,
      portfolioId: userInvestmentLots.portfolioId,
    })
    .from(userInvestmentLots)
    .innerJoin(userPortfolios, eq(userInvestmentLots.portfolioId, userPortfolios.id))
    .where(and(eq(userInvestmentLots.id, lotId), eq(userPortfolios.userId, ownerId)))
    .limit(1);

  return lot;
}

export function findPortfolioSummaryByOwner(ownerId: string, portfolioId: string) {
  return db.query.userPortfolios.findFirst({
    where: and(eq(userPortfolios.id, portfolioId), eq(userPortfolios.userId, ownerId)),
    with: {
      lots: true,
    },
  });
}

export function createLot(values: typeof userInvestmentLots.$inferInsert) {
  return db.insert(userInvestmentLots).values(values).returning();
}

export async function createLotWithBuyTransaction(values: typeof userInvestmentLots.$inferInsert) {
  return db.transaction(async (tx) => {
    const [newLot] = await tx.insert(userInvestmentLots).values(values).returning();

    await tx.insert(userTransactions).values({
      lotId: newLot.id,
      transactionType: 'buy',
      date: values.purchaseDate,
      amount: (Number(values.amount) * 100).toString(),
    });

    return newLot;
  });
}

export function updateLotById(lotId: string, values: Record<string, unknown>) {
  return db
    .update(userInvestmentLots)
    .set(values)
    .where(eq(userInvestmentLots.id, lotId))
    .returning();
}

export function deleteLotById(lotId: string) {
  return db.delete(userInvestmentLots).where(eq(userInvestmentLots.id, lotId)).returning();
}
