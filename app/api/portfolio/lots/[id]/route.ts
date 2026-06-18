import { NextRequest, NextResponse } from 'next/server';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import {
  PortfolioServiceError,
} from '@/lib/server/portfolio/errors';
import { deleteOwnerLot, updateOwnerLot } from '@/lib/server/portfolio/commands';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/server/http/api-handler';
import { createDomainErrorResponse } from '@/lib/server/http/responses';
import { getAuthenticatedPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';

export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(async (
  req: NextRequest,
  { params },
) => {
  try {
    const authContext = await getAuthenticatedPortfolioRouteContext();
    if (!authContext.ok) return authContext.response;

    const { owner } = authContext.context;
    const {id} = await params;
    const body = await req.json();
    const validated = InvestmentLotSchema.partial().parse(body);

    const updatedLot = await updateOwnerLot(owner.ownerId, id, validated);
    return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse(updatedLot)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    console.error('Failed to update lot:', error);
    return NextResponse.json(createErrorResponse('Database error', 'DATABASE_ERROR'), {status: 500});
  }
});

export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(async (
  req: NextRequest,
  { params },
) => {
  try {
    const authContext = await getAuthenticatedPortfolioRouteContext();
    if (!authContext.ok) return authContext.response;

    const { owner } = authContext.context;
    const {id} = await params;

    await deleteOwnerLot(owner.ownerId, id);
    return withPortfolioOwnerResponse(NextResponse.json(createSuccessResponse({success: true})), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    console.error('Failed to delete lot:', error);
    return NextResponse.json(createErrorResponse('Database error', 'DATABASE_ERROR'), {status: 500});
  }
});
