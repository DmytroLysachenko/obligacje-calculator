import { calculationService } from '@/features/bond-core/application-service';
import { TaxStrategy } from '@/features/bond-core/types';
import {
  PortfolioSimulationCalculationEnvelope,
  ScenarioKind,
  type PortfolioSimulationResult,
} from '@/features/bond-core/types/scenarios';
import { getMacroAssumptionDefaults } from '@/lib/data/market-data';
import { getOwnedPortfolio } from '@/lib/server/portfolio/access';
import { PortfolioServiceError } from '@/lib/server/portfolio/errors';
import {
  findPortfolioByShareId,
  listLotsByPortfolio,
  listLotsByPortfolioIds,
  listPortfoliosByOwner,
} from '@/lib/server/portfolio/repository';
import { buildPortfolioSimulationPayload } from '@/lib/server/portfolio/simulation';
export {
  buildSharedPortfolioPageMetadata,
  getPublicSharedPortfolioByShareId,
  getPublicSharedPortfolioPageData,
} from './shared-page-service';

const emptySimulationResult: PortfolioSimulationResult = {
  items: [],
  aggregatedTimeline: [],
  summary: {
    totalInvested: 0,
    totalNetValue: 0,
    totalProfit: 0,
  },
};

export async function listOwnerPortfolios(ownerId: string) {
  return listPortfoliosByOwner(ownerId);
}

export async function listPortfolioLots(ownerId: string, portfolioId: string) {
  const portfolio = await getOwnedPortfolio(ownerId, portfolioId);

  if (!portfolio) {
    throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
  }

  return listLotsByPortfolio(portfolioId);
}

export async function simulateOwnerPortfolio(
  ownerId: string,
  portfolioId: string,
  options?: {
    expectedInflation?: number;
  },
) {
  const portfolio = await getOwnedPortfolio(ownerId, portfolioId);

  if (!portfolio) {
    throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
  }

  const lots = await listLotsByPortfolio(portfolioId);

  if (lots.length === 0) {
    return emptySimulationResult;
  }

  const macroDefaults = await getMacroAssumptionDefaults();
  const envelope = await calculationService.calculate({
    kind: ScenarioKind.PORTFOLIO_SIMULATION,
    payload: buildPortfolioSimulationPayload(lots, {
      expectedInflation: options?.expectedInflation ?? macroDefaults.expectedInflation,
    }),
  });

  return envelope.result;
}

export async function exportOwnerPortfolio(
  ownerId: string,
  portfolioId: string,
  formatMode: 'portfolio' | 'package' = 'portfolio',
) {
  const portfolio = await getOwnedPortfolio(ownerId, portfolioId);

  if (!portfolio) {
    throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
  }

  const lots = await listLotsByPortfolio(portfolioId);
  const macroDefaults = await getMacroAssumptionDefaults();
  const payload = buildPortfolioSimulationPayload(lots, {
    taxStrategy: TaxStrategy.STANDARD,
    rollover: true,
    expectedInflation: macroDefaults.expectedInflation,
    expectedNbpRate: macroDefaults.expectedNbpRate,
  });

  const simulation =
    lots.length > 0
      ? ((await calculationService.calculate({
          kind: ScenarioKind.PORTFOLIO_SIMULATION,
          payload,
        })) as PortfolioSimulationCalculationEnvelope)
      : null;

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appVersion: '2.7.0-db-driven-metadata',
    packageType: formatMode === 'package' ? 'portfolio-package' : 'portfolio-export',
    assumptions: {
      expectedInflation: macroDefaults.expectedInflation,
      expectedNbpRate: macroDefaults.expectedNbpRate,
      taxStrategy: TaxStrategy.STANDARD,
      withdrawalDate: payload.withdrawalDate,
    },
    portfolio: {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      lots: lots.map((lot) => ({
        id: lot.id,
        bondType: lot.bondType,
        bondTypeId: lot.bondTypeId,
        bondSeriesId: lot.bondSeriesId,
        purchaseDate: lot.purchaseDate,
        amount: lot.amount,
        isRebought: lot.isRebought,
        notes: lot.notes,
      })),
    },
    summary: simulation?.result.summary ?? null,
  };

  return {
    exportData,
    fileName: `${portfolio.name.replace(/\s+/g, '_').toLowerCase()}_${formatMode}.json`,
  };
}

export async function summarizeOwnerPortfolios(ownerId: string) {
  const portfolios = await listPortfoliosByOwner(ownerId);

  if (portfolios.length === 0) {
    return emptySimulationResult;
  }

  const lots = await listLotsByPortfolioIds(portfolios.map((portfolio) => portfolio.id));

  if (lots.length === 0) {
    return emptySimulationResult;
  }

  const envelope = await calculationService.calculate({
    kind: ScenarioKind.PORTFOLIO_SIMULATION,
    payload: buildPortfolioSimulationPayload(lots),
  });

  return envelope.result;
}

export { findPortfolioByShareId };
