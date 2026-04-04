import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userInvestmentLots } from '@/db/schema';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import { eq } from 'drizzle-orm';
import {
  applyPortfolioOwnerCookie,
  getOwnedLot,
  getOwnedPortfolio,
  resolvePortfolioOwner,
} from '@/lib/portfolio-access';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';

export async function GET(req: NextRequest) {
  try {
    const owner = await resolvePortfolioOwner();
    const url = new URL(req.url);
    const portfolioId = url.searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json(
        createErrorResponse('Portfolio ID is required', 'MISSING_PARAM'), 
        { status: 400 }
      );
    }

    const portfolio = await getOwnedPortfolio(owner.ownerId, portfolioId);
    if (!portfolio) {
      return NextResponse.json(
        createErrorResponse('Portfolio not found', 'NOT_FOUND'), 
        { status: 404 }
      );
    }

    const lots = await db.query.userInvestmentLots.findMany({
      where: eq(userInvestmentLots.portfolioId, portfolioId),
      orderBy: (p, { desc }) => [desc(p.purchaseDate)],
    });

    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(lots)), owner);
  } catch (error) {
    console.error('Failed to fetch lots:', error);
    return NextResponse.json(
      createErrorResponse('Database error', 'DATABASE_ERROR'), 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const owner = await resolvePortfolioOwner();
    const body = await req.json();
    const validated = InvestmentLotSchema.parse(body);

    const portfolio = await getOwnedPortfolio(owner.ownerId, validated.portfolioId);
    if (!portfolio) {
      return NextResponse.json(
        createErrorResponse('Portfolio not found', 'NOT_FOUND'), 
        { status: 404 }
      );
    }

    const [newLot] = await db.insert(userInvestmentLots).values({
      portfolioId: validated.portfolioId,
      bondType: validated.bondType,
      purchaseDate: validated.purchaseDate,
      amount: validated.amount.toString(),
      isRebought: validated.isRebought,
      notes: validated.notes,
    }).returning();

    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(newLot)), owner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Validation failed', 'VALIDATION_ERROR', error.issues), 
        { status: 400 }
      );
    }
    console.error('Failed to create investment lot:', error);
    return NextResponse.json(
      createErrorResponse('Database error', 'DATABASE_ERROR'), 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const owner = await resolvePortfolioOwner();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        createErrorResponse('Lot ID is required', 'MISSING_PARAM'), 
        { status: 400 }
      );
    }

    const lot = await getOwnedLot(owner.ownerId, id);
    if (!lot) {
      return NextResponse.json(
        createErrorResponse('Lot not found', 'NOT_FOUND'), 
        { status: 404 }
      );
    }

    await db.delete(userInvestmentLots).where(eq(userInvestmentLots.id, id));

    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse({ success: true })), owner);
  } catch (error) {
    console.error('Failed to delete lot:', error);
    return NextResponse.json(
      createErrorResponse('Database error', 'DATABASE_ERROR'), 
      { status: 500 }
    );
  }
}
