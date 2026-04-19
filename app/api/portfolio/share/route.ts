import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPortfolios } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
    }

    const { portfolioId, isPublic } = await req.json();

    if (!portfolioId) {
      return NextResponse.json(createErrorResponse('Portfolio ID is required', 'VALIDATION_ERROR'), { status: 400 });
    }

    await db.update(userPortfolios)
      .set({ isPublic, updatedAt: new Date() })
      .where(and(
        eq(userPortfolios.id, portfolioId),
        eq(userPortfolios.userId, session.user.id)
      ));

    return NextResponse.json(createSuccessResponse({ success: true }));
  } catch (error) {
    console.error('Failed to update portfolio sharing:', error);
    return NextResponse.json(createErrorResponse('Internal error', 'INTERNAL_ERROR'), { status: 500 });
  }
}
