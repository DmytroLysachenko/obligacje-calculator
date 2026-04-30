import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPortfolios, userInvestmentLots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/portfolio-access';
import { apiHandler } from '@/lib/api-handler';
import { createSuccessResponse } from '@/shared/types/api';
import { calculationService } from '@/features/bond-core/application-service';
import { PortfolioSimulationCalculationEnvelope, ScenarioKind, PortfolioSimulationPayload } from '@/features/bond-core/types/scenarios';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { addYears, format } from 'date-fns';

export const GET = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get('portfolioId');
  const formatMode = searchParams.get('format') ?? 'portfolio';

  if (!portfolioId) {
    throw new Error('Portfolio ID is required');
  }

  const portfolio = await db.query.userPortfolios.findFirst({
    where: eq(userPortfolios.id, portfolioId),
    with: {
      // Assuming drizzle-orm is configured with relations
    }
  });

  // Since we don't have relations explicitly defined in schema.ts yet, we fetch separately
  const lots = await db.query.userInvestmentLots.findMany({
    where: eq(userInvestmentLots.portfolioId, portfolioId),
  });

  const withdrawalDate = format(addYears(new Date(), 10), 'yyyy-MM-dd');
  const payload: PortfolioSimulationPayload = {
    investments: lots.map((lot) => ({
      bondType: lot.bondType as BondType,
      amount: Number(lot.amount),
      purchaseDate: lot.purchaseDate,
      isRebought: lot.isRebought ?? false,
      taxStrategy: TaxStrategy.STANDARD,
      rollover: true,
    })),
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    withdrawalDate,
  };
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
      withdrawalDate,
    },
    portfolio: {
      name: portfolio?.name,
      description: portfolio?.description,
      lots: lots.map(lot => ({
        bondType: lot.bondType,
        purchaseDate: lot.purchaseDate,
        amount: lot.amount,
        isRebought: lot.isRebought,
        notes: lot.notes
        }))
    },
    summary: simulation?.result.summary ?? null,
  };

  if (formatMode === 'advisor') {
    const advisorExport = {
      ...baseExport,
      advisorSummary: {
        title: portfolio?.name ?? 'Portfolio summary',
        totalLots: lots.length,
        totalInvested: simulation?.result.summary.totalInvested ?? null,
        totalNetValue: simulation?.result.summary.totalNetValue ?? null,
        totalProfit: simulation?.result.summary.totalProfit ?? null,
        note: 'Prepared for external review. Values are simulation-based and not investment advice.',
      },
    };

    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(advisorExport)), owner);
  }

  const exportData = {
    ...baseExport,
    packageType: formatMode === 'package' ? 'portfolio-package' : 'portfolio-export',
  };

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(exportData)), owner);
});
