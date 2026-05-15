import { NextRequest, NextResponse } from 'next/server';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import { db } from '@/db';
import { userInvestmentLots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildPortfolioSimulationPayload } from '@/lib/portfolio-simulation';
import { applyPortfolioOwnerCookie, getOwnedPortfolio, resolvePortfolioOwner } from '@/lib/portfolio-access';
import { ensurePortfolioSchemaCompat } from '@/lib/db-schema-compat';

export async function POST(req: NextRequest) {
  try {
    await ensurePortfolioSchemaCompat();
    const owner = await resolvePortfolioOwner();
    const body = await req.json();
    const { portfolioId, expectedInflation = 3.5 } = body;

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

    const lots = await db.query.userInvestmentLots.findMany({
      where: eq(userInvestmentLots.portfolioId, portfolioId),
    });

    if (lots.length === 0) {
      return applyPortfolioOwnerCookie(
        NextResponse.json(createSuccessResponse({
          items: [],
          aggregatedTimeline: [],
          summary: { totalInvested: 0, totalNetValue: 0, totalProfit: 0 }
        })),
        owner,
      );
    }

    const envelope = await calculationService.calculate({
      kind: ScenarioKind.PORTFOLIO_SIMULATION,
      payload: buildPortfolioSimulationPayload(lots, { expectedInflation }),
    });

    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(envelope.result)), owner);
  } catch (error) {
    console.error('Portfolio simulation failed:', error);
    return NextResponse.json(
      createErrorResponse('Simulation failed', 'INTERNAL_ERROR'), 
      { status: 500 }
    );
  }
}
