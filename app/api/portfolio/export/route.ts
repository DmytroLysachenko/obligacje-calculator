import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userInvestmentLots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { applyPortfolioOwnerCookie, getOwnedPortfolio, resolvePortfolioOwner } from '@/lib/portfolio-access';
import { apiHandler } from '@/lib/api-handler';
import { createSuccessResponse } from '@/shared/types/api';
import { calculationService } from '@/features/bond-core/application-service';
import { PortfolioSimulationCalculationEnvelope, ScenarioKind } from '@/features/bond-core/types/scenarios';
import { TaxStrategy } from '@/features/bond-core/types';
import { ensurePortfolioSchemaCompat } from '@/lib/db-schema-compat';
import { buildPortfolioSimulationPayload } from '@/lib/portfolio-simulation';

export const GET = apiHandler(async (req: NextRequest) => {
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get('portfolioId');
  const formatMode = searchParams.get('format') ?? 'portfolio';

  if (!portfolioId) {
    throw new Error('Portfolio ID is required');
  }

  const portfolio = await getOwnedPortfolio(owner.ownerId, portfolioId);
  if (!portfolio) {
    throw new Error('Portfolio not found');
  }

  const lots = await db.query.userInvestmentLots.findMany({
    where: eq(userInvestmentLots.portfolioId, portfolioId),
  });

  const payload = buildPortfolioSimulationPayload(lots, {
    taxStrategy: TaxStrategy.STANDARD,
    rollover: true,
  });
  const simulation = lots.length > 0
    ? await calculationService.calculate({
        kind: ScenarioKind.PORTFOLIO_SIMULATION,
        payload,
      }) as PortfolioSimulationCalculationEnvelope
    : null;

  const baseExport = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appVersion: '2.7.0-db-driven-metadata',
    assumptions: {
      expectedInflation: 3.5,
      expectedNbpRate: 5.25,
      taxStrategy: TaxStrategy.STANDARD,
      withdrawalDate: payload.withdrawalDate,
    },
    portfolio: {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      lots: lots.map(lot => ({
        id: lot.id,
        bondType: lot.bondType,
        bondTypeId: lot.bondTypeId,
        bondSeriesId: lot.bondSeriesId,
        purchaseDate: lot.purchaseDate,
        amount: lot.amount,
        isRebought: lot.isRebought,
        notes: lot.notes
      })),
    },
    summary: simulation?.result.summary ?? null,
  };

  const exportData = {
    ...baseExport,
    packageType: formatMode === 'package' ? 'portfolio-package' : 'portfolio-export',
  };

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(exportData)), owner);
});
