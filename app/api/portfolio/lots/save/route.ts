import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userInvestmentLots, userTransactions, userPortfolios } from '@/db/schema';
import { resolvePortfolioOwner, applyPortfolioOwnerCookie } from '@/lib/portfolio-access';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const owner = await resolvePortfolioOwner();
    const body = await req.json();
    
    const { portfolioId, bondType, purchaseDate, amount, isRebought, notes } = body;

    if (!portfolioId || !bondType || !purchaseDate || !amount) {
      return NextResponse.json(createErrorResponse('Missing required fields', 'VALIDATION_ERROR'), { status: 400 });
    }

    // Verify portfolio ownership
    const portfolio = await db.query.userPortfolios.findFirst({
      where: and(eq(userPortfolios.id, portfolioId), eq(userPortfolios.userId, owner.ownerId))
    });

    if (!portfolio) {
      return NextResponse.json(createErrorResponse('Portfolio not found', 'NOT_FOUND'), { status: 404 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Create the lot
      const [newLot] = await tx.insert(userInvestmentLots).values({
        portfolioId,
        bondType,
        purchaseDate,
        amount: amount.toString(),
        isRebought: !!isRebought,
        notes,
      }).returning();

      // 2. Create the initial 'buy' transaction
      await tx.insert(userTransactions).values({
        lotId: newLot.id,
        transactionType: 'buy',
        date: purchaseDate,
        amount: (parseFloat(amount) * 100).toString(), // Total PLN
      });

      return newLot;
    });

    return applyPortfolioOwnerCookie(
      NextResponse.json(createSuccessResponse(result)),
      owner
    );
  } catch (error) {
    console.error('Failed to save lot transactionally:', error);
    return NextResponse.json(createErrorResponse('Internal error', 'INTERNAL_ERROR'), { status: 500 });
  }
}
