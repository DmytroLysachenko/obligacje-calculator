import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userInvestmentLots, userPortfolios } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { resolvePortfolioOwner, applyPortfolioOwnerCookie } from '@/lib/portfolio-access';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind, PortfolioSimulationPayload } from '@/features/bond-core/types/scenarios';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { createSuccessResponse, createErrorResponse } from '@/shared/types/api';
import { addYears, format } from 'date-fns';

import { apiHandler } from '@/lib/api-handler';

export const GET = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  
  // 1. Fetch all portfolios for this user
  const portfolios = await db.query.userPortfolios.findMany({
    where: eq(userPortfolios.userId, owner.ownerId),
  });

  if (portfolios.length === 0) {
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse({ 
      items: [], 
      aggregatedTimeline: [],
      summary: { totalInvested: 0, totalNetValue: 0, totalProfit: 0 }
    })), owner);
  }

  const portfolioIds = portfolios.map(p => p.id);

  // 2. Fetch all lots for these portfolios
  const lots = await db.query.userInvestmentLots.findMany({
    where: inArray(userInvestmentLots.portfolioId, portfolioIds),
  });

  if (lots.length === 0) {
      return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse({ 
        items: [], 
        aggregatedTimeline: [],
        summary: { totalInvested: 0, totalNetValue: 0, totalProfit: 0 }
      })), owner);
  }

  // 3. Construct Payload for Portfolio Simulation
  const withdrawalDate = format(addYears(new Date(), 10), 'yyyy-MM-dd');
  
  const payload: PortfolioSimulationPayload = {
    investments: lots.map(lot => ({
      bondType: lot.bondType as BondType,
      amount: Number(lot.amount),
      purchaseDate: lot.purchaseDate,
      isRebought: lot.isRebought ?? false,
      taxStrategy: TaxStrategy.STANDARD, // Default for now
      rollover: true, // Default for now
    })),
    expectedInflation: 3.5, // Default for now
    expectedNbpRate: 5.25, // Default for now
    withdrawalDate,
  };

  // 4. Run Simulation
  const envelope = await calculationService.calculate({
    kind: ScenarioKind.PORTFOLIO_SIMULATION,
    payload,
  });

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(envelope)), owner);
});
