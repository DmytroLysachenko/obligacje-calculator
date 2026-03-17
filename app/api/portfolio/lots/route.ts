import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userInvestmentLots, userPortfolios } from '@/db/schema';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Mock user for MVP
const MOCK_USER_ID = 'anonymous-user-123';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get('portfolioId');

  if (!portfolioId) {
    return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
  }

  try {
    // Verify ownership indirectly
    const portfolio = await db.query.userPortfolios.findFirst({
      where: and(eq(userPortfolios.id, portfolioId), eq(userPortfolios.userId, MOCK_USER_ID)),
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const lots = await db.query.userInvestmentLots.findMany({
      where: eq(userInvestmentLots.portfolioId, portfolioId),
      orderBy: (l, { desc }) => [desc(l.purchaseDate)],
    });
    
    return NextResponse.json(lots);
  } catch (error) {
    console.error('Failed to fetch lots:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = InvestmentLotSchema.parse(body);

    // Verify ownership
    const portfolio = await db.query.userPortfolios.findFirst({
      where: and(eq(userPortfolios.id, validated.portfolioId), eq(userPortfolios.userId, MOCK_USER_ID)),
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const [newLot] = await db.insert(userInvestmentLots).values({
      portfolioId: validated.portfolioId,
      bondType: validated.bondType,
      purchaseDate: validated.purchaseDate,
      amount: validated.amount.toString(),
      isRebought: validated.isRebought,
      notes: validated.notes,
    }).returning();

    return NextResponse.json(newLot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Failed to create lot:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
