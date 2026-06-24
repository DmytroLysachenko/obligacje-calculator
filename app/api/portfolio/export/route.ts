import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/server/http/api-handler';
import { exportOwnerPortfolio } from '@/lib/server/portfolio/queries';
import { createValidationErrorResponse, okJson } from '@/lib/server/http/responses';
import {
  portfolioDomainErrorResponse,
  withAuthenticatedPortfolioOwner,
} from '@/lib/server/portfolio/http';

export const GET = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(async (owner) => {
    const { searchParams } = new URL(req.url);
    const portfolioId = searchParams.get('portfolioId');
    const formatMode = searchParams.get('format') ?? 'portfolio';

    if (!portfolioId) {
      return createValidationErrorResponse('Portfolio ID is required', 'MISSING_PARAM');
    }

    try {
      const { exportData, fileName } = await exportOwnerPortfolio(
        owner.ownerId,
        portfolioId,
        formatMode === 'package' ? 'package' : 'portfolio',
      );

      return okJson(exportData, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'X-Export-Format': formatMode,
        },
      });
    } catch (error) {
      const response = portfolioDomainErrorResponse(error);
      if (response) return response;

      throw error;
    }
  });
});
