import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPortfolios } from '@/db/schema';
import { PortfolioSchema } from '@/features/bond-core/types/portfolio-schemas';
import { eq } from 'drizzle-orm';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/portfolio-access';
import { z } from 'zod';

export async function GET() {
  try {
    const owner = await resolvePortfolioOwner();
    const portfolios = await db.query.userPortfolios.findMany({
      where: eq(userPortfolios.userId, owner.ownerId),
      orderBy: (p, { desc }) => [desc(p.updatedAt)],
    });

    return applyPortfolioOwnerCookie(NextResponse.json(portfolios), owner);
  } catch (error) {
    console.error('Failed to fetch portfolios:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        items: [],
        error: 'Portfolio storage is temporarily unavailable',
      },
      { status: 200 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const owner = await resolvePortfolioOwner();
    const body = await req.json();
    const validated = PortfolioSchema.parse(body);

    const [newPortfolio] = await db.insert(userPortfolios).values({
      userId: owner.ownerId,
      name: validated.name,
      description: validated.description,
    }).returning();

    return applyPortfolioOwnerCookie(NextResponse.json(newPortfolio), owner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Failed to create portfolio:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Portfolio storage is temporarily unavailable' }, { status: 500 });
  }
}
