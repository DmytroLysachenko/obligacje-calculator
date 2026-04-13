import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPortfolios } from '@/db/schema';
import { PortfolioSchema } from '@/features/bond-core/types/portfolio-schemas';
import { eq } from 'drizzle-orm';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/portfolio-access';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/api-handler';

export const GET = apiHandler(async () => {
  const owner = await resolvePortfolioOwner();
  const portfolios = await db.query.userPortfolios.findMany({
    where: eq(userPortfolios.userId, owner.ownerId),
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  });

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(portfolios)), owner);
});

export const POST = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const body = await req.json();
  const validated = PortfolioSchema.parse(body);

  const [newPortfolio] = await db.insert(userPortfolios).values({
    userId: owner.ownerId,
    name: validated.name,
    description: validated.description,
  }).returning();

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(newPortfolio)), owner);
});
