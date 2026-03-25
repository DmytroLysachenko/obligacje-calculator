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

export async function GET(req: NextRequest) {
  try {
    const owner = await resolvePortfolioOwner();
    const url = new URL(req.url);
    const portfolioId = url.searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
    }

    const portfolio = await getOwnedPortfolio(owner.ownerId, portfolioId);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const lots = await db.query.userInvestmentLots.findMany({
      where: eq(userInvestmentLots.portfolioId, portfolioId),
      orderBy: (p, { desc }) => [desc(p.purchaseDate)],
    });

    return applyPortfolioOwnerCookie(NextResponse.json(lots), owner);
  } catch (error) {
    console.error('Failed to fetch lots:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const owner = await resolvePortfolioOwner();
    const body = await req.json();
    const validated = InvestmentLotSchema.parse(body);

    const portfolio = await getOwnedPortfolio(owner.ownerId, validated.portfolioId);
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

    return applyPortfolioOwnerCookie(NextResponse.json(newLot), owner);
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
    const owner = await resolvePortfolioOwner();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lot ID is required' }, { status: 400 });
    }

    const lot = await getOwnedLot(owner.ownerId, id);
    if (!lot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    await db.delete(userInvestmentLots).where(eq(userInvestmentLots.id, id));

    return applyPortfolioOwnerCookie(NextResponse.json({ success: true }), owner);
  } catch (error) {
    console.error('Failed to delete lot:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
