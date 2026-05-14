import { NextRequest, NextResponse } from 'next/server';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import { db } from '@/db';
import { userInvestmentLots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildPortfolioSimulationPayload } from '@/lib/portfolio-simulation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolioId, expectedInflation = 3.5 } = body;

    if (!portfolioId) {
      return NextResponse.json(createErrorResponse('Portfolio ID is required', 'VALIDATION_ERROR'), { status: 400 });
    }

    const lots = await db.query.userInvestmentLots.findMany({
      where: eq(userInvestmentLots.portfolioId, portfolioId),
    });

    if (lots.length === 0) {
      return NextResponse.json(createSuccessResponse({
        items: [],
        aggregatedTimeline: [],
        summary: { totalInvested: 0, totalNetValue: 0, totalProfit: 0 }
      }));
    }

    const envelope = await calculationService.calculate({
      kind: ScenarioKind.PORTFOLIO_SIMULATION,
      payload: buildPortfolioSimulationPayload(lots, { expectedInflation }),
    });

    return NextResponse.json(createSuccessResponse(envelope.result));
  } catch (error) {
    console.error('Portfolio simulation failed:', error);
    return NextResponse.json(
      createErrorResponse('Simulation failed', 'INTERNAL_ERROR'), 
      { status: 500 }
    );
  }
}
