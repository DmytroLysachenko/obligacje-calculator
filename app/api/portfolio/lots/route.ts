import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userInvestmentLots } from '@/db/schema';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const portfolioId = url.searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
    }

    const lots = await db.query.userInvestmentLots.findMany({
      where: eq(userInvestmentLots.portfolioId, portfolioId),
      orderBy: (p, { desc }) => [desc(p.purchaseDate)],
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
    console.error('Failed to create investment lot:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lot ID is required' }, { status: 400 });
    }

    await db.delete(userInvestmentLots).where(eq(userInvestmentLots.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete lot:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
