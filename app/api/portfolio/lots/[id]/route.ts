import { NextRequest } from 'next/server';

import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { errorJson, okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';
import { deleteOwnerLot, updateOwnerLot } from '@/lib/server/portfolio/commands';
import {
  portfolioDomainErrorResponse,
  withAuthenticatedPortfolioOwner,
} from '@/lib/server/portfolio/http';

const logger = createServerLogger('PortfolioLotApi');

export const PATCH = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req: NextRequest, { params }) => {
    return withAuthenticatedPortfolioOwner(async (owner) => {
      const { id } = await params;
      const validated = await readJsonBody(req, InvestmentLotSchema.partial());

      try {
        const updatedLot = await updateOwnerLot(owner.ownerId, id, validated);
        return okJson(updatedLot);
      } catch (error) {
        const response = portfolioDomainErrorResponse(error);
        if (response) return response;

        logger.error('Failed to update lot', error);
        return errorJson('Database error', 'DATABASE_ERROR', undefined, { status: 500 });
      }
    });
  },
);

export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(
  async (req: NextRequest, { params }) => {
    return withAuthenticatedPortfolioOwner(async (owner) => {
      const { id } = await params;

      try {
        await deleteOwnerLot(owner.ownerId, id);
        return okJson({ success: true });
      } catch (error) {
        const response = portfolioDomainErrorResponse(error);
        if (response) return response;

        logger.error('Failed to delete lot', error);
        return errorJson('Database error', 'DATABASE_ERROR', undefined, { status: 500 });
      }
    });
  },
);
