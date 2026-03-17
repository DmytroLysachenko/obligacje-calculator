import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPortfolios } from '@/db/schema';
import { PortfolioSchema } from '@/features/bond-core/types/portfolio-schemas';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// For MVP, we use a hardcoded user ID. 
// In a real app, this would come from an Auth session.
const MOCK_USER_ID = 'anonymous-user-123';

export async function GET() {
  try {
    const portfolios = await db.query.userPortfolios.findMany({
      where: eq(userPortfolios.userId, MOCK_USER_ID),
      orderBy: (p, { desc }) => [desc(p.updatedAt)],
    });
    
    return NextResponse.json(portfolios);
  } catch (error) {
    console.error('Failed to fetch portfolios:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = PortfolioSchema.parse(body);

    const [newPortfolio] = await db.insert(userPortfolios).values({
      userId: MOCK_USER_ID,
      name: validated.name,
      description: validated.description,
    }).returning();

    return NextResponse.json(newPortfolio);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Failed to create portfolio:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
