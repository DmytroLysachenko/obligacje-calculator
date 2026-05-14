import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userInvestmentLots, userPortfolios } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { resolvePortfolioOwner, applyPortfolioOwnerCookie } from '@/lib/portfolio-access';
import { calculationService } from '@/features/bond-core/application-service';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/api-handler';
import { ensurePortfolioSchemaCompat } from '@/lib/db-schema-compat';
import { buildPortfolioSimulationPayload } from '@/lib/portfolio-simulation';

export const GET = apiHandler(async () => {
  await ensurePortfolioSchemaCompat();
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

  // 4. Run Simulation
  const envelope = await calculationService.calculate({
    kind: ScenarioKind.PORTFOLIO_SIMULATION,
    payload: buildPortfolioSimulationPayload(lots),
  });

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(envelope.result)), owner);
});
