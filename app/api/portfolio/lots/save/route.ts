import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import {
  createPortfolioLotWithBuyTransaction,
  PortfolioServiceError,
} from '@/lib/server/portfolio/service';
import { createDomainErrorResponse, createValidationErrorResponse } from '@/lib/server/http/responses';
import { apiHandler } from '@/lib/server/http/api-handler';
import { getPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';

export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const { owner } = await getPortfolioRouteContext();
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

    return withPortfolioOwnerResponse(
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
});

