import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPortfolios } from '@/db/schema';
import { PortfolioSchema } from '@/features/bond-core/types/portfolio-schemas';
import { eq } from 'drizzle-orm';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/portfolio-access';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/api-handler';
import { ensurePortfolioSchemaCompat } from '@/lib/db-schema-compat';

export const GET = apiHandler(async () => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const portfolios = await db.query.userPortfolios.findMany({
    where: eq(userPortfolios.userId, owner.ownerId),
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  });

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(portfolios)), owner);
});

export const POST = apiHandler(async (req: NextRequest) => {
  await ensurePortfolioSchemaCompat();
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

export const DELETE = apiHandler(async (req: NextRequest) => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return applyPortfolioOwnerCookie(
      NextResponse.json({ error: 'Missing portfolio id.' }, { status: 400 }),
      owner,
    );
  }

  const existingPortfolio = await db.query.userPortfolios.findFirst({
    where: eq(userPortfolios.id, id),
  });

  if (!existingPortfolio || existingPortfolio.userId !== owner.ownerId) {
    return applyPortfolioOwnerCookie(
      NextResponse.json({ error: 'Portfolio not found.' }, { status: 404 }),
      owner,
    );
  }

  const [deletedPortfolio] = await db
    .delete(userPortfolios)
    .where(eq(userPortfolios.id, id))
    .returning();

  return applyPortfolioOwnerCookie(
    NextResponse.json(createSuccessResponse(deletedPortfolio)),
    owner,
  );
});
