import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPortfolios } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import { ensurePortfolioSchemaCompat } from '@/lib/db-schema-compat';
import { applyPortfolioOwnerCookie, getOwnedPortfolio, resolvePortfolioOwner } from '@/lib/portfolio-access';

export async function POST(req: NextRequest) {
  try {
    await ensurePortfolioSchemaCompat();
    const owner = await resolvePortfolioOwner();

    const { portfolioId, isPublic } = await req.json();

    if (!portfolioId) {
      return NextResponse.json(createErrorResponse('Portfolio ID is required', 'VALIDATION_ERROR'), { status: 400 });
    }

    const portfolio = await getOwnedPortfolio(owner.ownerId, portfolioId);
    if (!portfolio) {
      return applyPortfolioOwnerCookie(
        NextResponse.json(createErrorResponse('Portfolio not found', 'NOT_FOUND'), { status: 404 }),
        owner,
      );
    }

    await db.update(userPortfolios)
      .set({ isPublic, updatedAt: new Date() })
      .where(and(
        eq(userPortfolios.id, portfolioId),
        eq(userPortfolios.userId, owner.ownerId)
      ));

    return applyPortfolioOwnerCookie(
      NextResponse.json(createSuccessResponse({ success: true, shareId: portfolio.shareId, isPublic })),
      owner,
    );
  } catch (error) {
    console.error('Failed to update portfolio sharing:', error);
    return NextResponse.json(createErrorResponse('Internal error', 'INTERNAL_ERROR'), { status: 500 });
  }
}
