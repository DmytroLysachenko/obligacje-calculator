import { NextRequest, NextResponse } from 'next/server';
import { resolvePortfolioOwner, applyPortfolioOwnerCookie } from '@/lib/server/portfolio/access';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import {
  createPortfolioLotWithBuyTransaction,
  PortfolioServiceError,
} from '@/lib/server/portfolio/service';
import { createDomainErrorResponse, createValidationErrorResponse } from '@/lib/server/http/responses';

export async function POST(req: NextRequest) {
  try {
    await ensurePortfolioSchemaCompat();
    const owner = await resolvePortfolioOwner();
    const body = await req.json();
    
    const { portfolioId, bondType, purchaseDate, amount, isRebought, notes } = body;

    if (!portfolioId || !bondType || !purchaseDate || !amount) {
      return createValidationErrorResponse('Missing required fields');
    }

    const result = await createPortfolioLotWithBuyTransaction(owner.ownerId, {
      portfolioId,
      bondType,
      purchaseDate,
      amount,
      isRebought,
      notes,
    });

    return applyPortfolioOwnerCookie(
      NextResponse.json(createSuccessResponse(result)),
      owner
    );
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    console.error('Failed to save lot transactionally:', error);
    return NextResponse.json(createErrorResponse('Internal error', 'INTERNAL_ERROR'), { status: 500 });
  }
}

