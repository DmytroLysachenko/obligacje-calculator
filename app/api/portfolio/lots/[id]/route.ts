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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await resolvePortfolioOwner();
    const { id } = await params;
    const body = await req.json();
    
    // Partial validation for PATCH
    const validated = InvestmentLotSchema.partial().parse(body);

    const existingLot = await getOwnedLot(owner.ownerId, id);
    if (!existingLot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    if (validated.portfolioId) {
      const targetPortfolio = await getOwnedPortfolio(owner.ownerId, validated.portfolioId);
      if (!targetPortfolio) {
        return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
      }
    }

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.amount !== undefined) {
      updateData.amount = validated.amount.toString();
    }

    const [updatedLot] = await db
      .update(userInvestmentLots)
      .set(updateData)
      .where(eq(userInvestmentLots.id, id))
      .returning();

    if (!updatedLot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    return applyPortfolioOwnerCookie(NextResponse.json(updatedLot), owner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Failed to update lot:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await resolvePortfolioOwner();
    const { id } = await params;

    const existingLot = await getOwnedLot(owner.ownerId, id);
    if (!existingLot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }
    
    const [deletedLot] = await db
      .delete(userInvestmentLots)
      .where(eq(userInvestmentLots.id, id))
      .returning();

    if (!deletedLot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    return applyPortfolioOwnerCookie(NextResponse.json({ success: true }), owner);
  } catch (error) {
    console.error('Failed to delete lot:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
