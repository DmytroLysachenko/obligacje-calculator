import { NextRequest, NextResponse } from 'next/server';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import { db } from '@/db';
import { userInvestmentLots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { addYears, format } from 'date-fns';

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

    // Determine withdrawal date (e.g., 10 years from the latest purchase or maturity)
    const withdrawalDate = format(addYears(new Date(), 10), 'yyyy-MM-dd');

    const envelope = await calculationService.calculate({
      kind: ScenarioKind.PORTFOLIO_SIMULATION,
      payload: {
        investments: lots.map(l => ({
          bondType: l.bondType as import('@/features/bond-core/types').BondType,
          amount: Number(l.amount) * 100,
          purchaseDate: l.purchaseDate,
          isRebought: l.isRebought ?? false,
        })),
        expectedInflation,
        withdrawalDate,
      },
    });
    
    return NextResponse.json(createSuccessResponse(envelope));
  } catch (error) {
    console.error('Portfolio simulation failed:', error);
    return NextResponse.json(
      createErrorResponse('Simulation failed', 'INTERNAL_ERROR'), 
      { status: 500 }
    );
  }
}
