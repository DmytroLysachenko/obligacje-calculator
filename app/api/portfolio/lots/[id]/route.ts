import { NextRequest } from 'next/server';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import {
  PortfolioServiceError,
} from '@/lib/server/portfolio/errors';
import { deleteOwnerLot, updateOwnerLot } from '@/lib/server/portfolio/commands';
import { apiHandler } from '@/lib/server/http/api-handler';
import { createDomainErrorResponse, errorJson, okJson } from '@/lib/server/http/responses';
import { getAuthenticatedPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';
import { readJsonBody } from '@/lib/server/http/read-json-body';

export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(async (
  req: NextRequest,
  { params },
) => {
  try {
    const authContext = await getAuthenticatedPortfolioRouteContext();
    if (!authContext.ok) return authContext.response;

    const { owner } = authContext.context;
    const {id} = await params;
    const validated = await readJsonBody(req, InvestmentLotSchema.partial());

    const updatedLot = await updateOwnerLot(owner.ownerId, id, validated);
    return withPortfolioOwnerResponse(okJson(updatedLot), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    console.error('Failed to update lot:', error);
    return errorJson('Database error', 'DATABASE_ERROR', undefined, {status: 500});
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
    return withPortfolioOwnerResponse(okJson({success: true}), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    console.error('Failed to delete lot:', error);
    return errorJson('Database error', 'DATABASE_ERROR', undefined, {status: 500});
  }
});
