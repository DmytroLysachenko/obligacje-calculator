import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPortfolios, userInvestmentLots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resolvePortfolioOwner } from '@/lib/portfolio-access';
import { apiHandler } from '@/lib/api-handler';
import { createSuccessResponse } from '@/shared/types/api';

export const GET = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get('portfolioId');

  if (!portfolioId) {
    throw new Error('Portfolio ID is required');
  }

  const portfolio = await db.query.userPortfolios.findFirst({
    where: eq(userPortfolios.id, portfolioId),
    with: {
      // Assuming drizzle-orm is configured with relations
    }
  });

  // Since we don't have relations explicitly defined in schema.ts yet, we fetch separately
  const lots = await db.query.userInvestmentLots.findMany({
    where: eq(userInvestmentLots.portfolioId, portfolioId),
  });

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    portfolio: {
      name: portfolio?.name,
      description: portfolio?.description,
      lots: lots.map(lot => ({
        bondType: lot.bondType,
        purchaseDate: lot.purchaseDate,
        amount: lot.amount,
        isRebought: lot.isRebought,
        notes: lot.notes
      }))
    }
  };

  return NextResponse.json(createSuccessResponse(exportData));
});
