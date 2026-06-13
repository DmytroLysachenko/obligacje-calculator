import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/server/http/api-handler';
import { createSuccessResponse } from '@/shared/types/api';
import { exportOwnerPortfolio, PortfolioServiceError } from '@/lib/server/portfolio/service';
import { createDomainErrorResponse } from '@/lib/server/http/responses';
import { getAuthenticatedPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';

export const GET = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get('portfolioId');
  const formatMode = searchParams.get('format') ?? 'portfolio';

  if (!portfolioId) {
    throw new Error('Portfolio ID is required');
  }

  try {
    const { exportData, fileName } = await exportOwnerPortfolio(
      owner.ownerId,
      portfolioId,
      formatMode === 'package' ? 'package' : 'portfolio',
    );

    const response = NextResponse.json(createSuccessResponse(exportData), {
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

