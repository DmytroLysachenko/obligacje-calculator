import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/server/http/api-handler';
import { PortfolioServiceError } from '@/lib/server/portfolio/errors';
import { exportOwnerPortfolio } from '@/lib/server/portfolio/queries';
import { createDomainErrorResponse, createValidationErrorResponse, okJson } from '@/lib/server/http/responses';
import { getAuthenticatedPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';

export const GET = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
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

    const response = okJson(exportData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Export-Format': formatMode,
      },
    });

    return withPortfolioOwnerResponse(response, owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return createDomainErrorResponse(error);
    }

    throw error;
  }
});

