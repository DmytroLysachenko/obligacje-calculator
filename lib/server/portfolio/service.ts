import {calculationService} from '@/features/bond-core/application-service';
import {PortfolioSimulationCalculationEnvelope, ScenarioKind, type PortfolioSimulationResult} from '@/features/bond-core/types/scenarios';
import {TaxStrategy} from '@/features/bond-core/types';
import {getMacroAssumptionDefaults} from '@/lib/data/market-data';
import {resolveStoredBondLotContext} from '@/lib/server/bonds/offer-terms';
import {buildPortfolioSimulationPayload} from '@/lib/server/portfolio/simulation';
import {getOwnedLot, getOwnedPortfolio} from '@/lib/server/portfolio/access';
import {
  createLot,
  createLotWithBuyTransaction,
  createPortfolio,
  deleteLotById,
  deletePortfolioById,
  findPortfolioById,
  findPortfolioByShareId,
  listLotsByPortfolio,
  listLotsByPortfolioIds,
  listPortfoliosByOwner,
  updateLotById,
  updatePortfolioVisibility,
} from './repository';

const emptySimulationResult: PortfolioSimulationResult = {
  items: [],
  aggregatedTimeline: [],
  summary: {
    totalInvested: 0,
    totalNetValue: 0,
    totalProfit: 0,
  },
};

export class PortfolioServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function listOwnerPortfolios(ownerId: string) {
  return listPortfoliosByOwner(ownerId);
}

export async function getPublicSharedPortfolioByShareId(shareId: string) {
  const portfolio = await findPortfolioByShareId(shareId);

  if (!portfolio || !portfolio.isPublic) {
    return null;
  }

  return portfolio;
}

export async function createOwnerPortfolio(ownerId: string, input: {name: string; description?: string}) {
  const [portfolio] = await createPortfolio(ownerId, input.name, input.description);
  return portfolio;
}

export async function deleteOwnerPortfolio(ownerId: string, portfolioId: string) {
  const existingPortfolio = await findPortfolioById(portfolioId);

  if (!existingPortfolio || existingPortfolio.userId !== ownerId) {
    throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
  }

  const [deletedPortfolio] = await deletePortfolioById(portfolioId);
  return deletedPortfolio;
}

export async function listPortfolioLots(ownerId: string, portfolioId: string) {
  const portfolio = await getOwnedPortfolio(ownerId, portfolioId);

  if (!portfolio) {
    throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
  }

  return listLotsByPortfolio(portfolioId);
}

export async function createPortfolioLot(
  ownerId: string,
  input: {
    portfolioId: string;
    bondType: string;
    purchaseDate: string;
    amount: number;
    selectedSeriesId?: string | null;
    isRebought: boolean;
    notes?: string;
  },
) {
  const portfolio = await getOwnedPortfolio(ownerId, input.portfolioId);

  if (!portfolio) {
    throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
  }

  const resolvedLotContext = await resolveStoredBondLotContext(
    input.bondType as import('@/features/bond-core/types').BondType,
    input.purchaseDate,
    input.selectedSeriesId,
  );

  const [newLot] = await createLot({
    portfolioId: input.portfolioId,
    bondType: input.bondType,
    bondTypeId: resolvedLotContext.bondTypeId,
    bondSeriesId: resolvedLotContext.bondSeriesId,
    purchaseDate: input.purchaseDate,
    amount: input.amount.toString(),
    isRebought: input.isRebought,
    notes: input.notes,
  });

  return newLot;
}

export async function createPortfolioLotWithBuyTransaction(
  ownerId: string,
  input: {
    portfolioId: string;
    bondType: string;
    purchaseDate: string;
    amount: string | number;
    isRebought?: boolean;
    notes?: string;
  },
) {
  const portfolio = await getOwnedPortfolio(ownerId, input.portfolioId);

  if (!portfolio) {
    throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
  }

  return createLotWithBuyTransaction({
    portfolioId: input.portfolioId,
    bondType: input.bondType,
    purchaseDate: input.purchaseDate,
    amount: String(input.amount),
    isRebought: Boolean(input.isRebought),
    notes: input.notes,
  });
}

export async function updateOwnerLot(
  ownerId: string,
  lotId: string,
  input: Partial<{
    portfolioId: string;
    bondType: string;
    purchaseDate: string;
    amount: number;
    isRebought: boolean;
    notes?: string;
  }>,
) {
  const existingLot = await getOwnedLot(ownerId, lotId);

  if (!existingLot) {
    throw new PortfolioServiceError('Lot not found', 404, 'NOT_FOUND');
  }

  if (input.portfolioId) {
    const targetPortfolio = await getOwnedPortfolio(ownerId, input.portfolioId);

    if (!targetPortfolio) {
      throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
    }
  }

  const updateData: Record<string, unknown> = {...input};

  if (input.amount !== undefined) {
    updateData.amount = input.amount.toString();
  }

  const [updatedLot] = await updateLotById(lotId, updateData);

  if (!updatedLot) {
    throw new PortfolioServiceError('Lot not found', 404, 'NOT_FOUND');
  }

  return updatedLot;
}

export async function deleteOwnerLot(ownerId: string, lotId: string) {
  const existingLot = await getOwnedLot(ownerId, lotId);

  if (!existingLot) {
    throw new PortfolioServiceError('Lot not found', 404, 'NOT_FOUND');
  }

  const [deletedLot] = await deleteLotById(lotId);

  if (!deletedLot) {
    throw new PortfolioServiceError('Lot not found', 404, 'NOT_FOUND');
  }
}

export async function toggleOwnerPortfolioSharing(ownerId: string, portfolioId: string, isPublic: boolean) {
  const portfolio = await getOwnedPortfolio(ownerId, portfolioId);

  if (!portfolio) {
    throw new PortfolioServiceError('Portfolio not found', 404, 'NOT_FOUND');
  }

  await updatePortfolioVisibility(ownerId, portfolioId, isPublic);

  return {
    success: true,
    shareId: portfolio.shareId,
    isPublic,
  };
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
    payload: buildPortfolioSimulationPayload(lots, {expectedInflation: options?.expectedInflation ?? macroDefaults.expectedInflation}),
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

  const simulation = lots.length > 0
    ? await calculationService.calculate({
        kind: ScenarioKind.PORTFOLIO_SIMULATION,
        payload,
      }) as PortfolioSimulationCalculationEnvelope
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

export async function importOwnerPortfolio(
  ownerId: string,
  input: {
    name: string;
    description?: string;
    lots: Array<{
      bondType: string;
      purchaseDate: string;
      amount: string | number;
      isRebought?: boolean;
      notes?: string;
    }>;
  },
) {
  const [createdPortfolio] = await createPortfolio(
    ownerId,
    `${input.name} (Imported)`,
    input.description ?? 'Imported portfolio package',
  );

  const importedLots = await Promise.all(
    input.lots.map(async (lot) => {
      const resolvedLotContext = await resolveStoredBondLotContext(
        lot.bondType as import('@/features/bond-core/types').BondType,
        lot.purchaseDate,
      );

      return {
        portfolioId: createdPortfolio.id,
        bondType: lot.bondType,
        bondTypeId: resolvedLotContext.bondTypeId,
        bondSeriesId: resolvedLotContext.bondSeriesId,
        purchaseDate: lot.purchaseDate,
        amount: String(lot.amount),
        isRebought: lot.isRebought ?? false,
        notes: lot.notes,
      };
    }),
  );

  const createdLots = await Promise.all(importedLots.map((lot) => createLot(lot)));

  return {
    portfolio: createdPortfolio,
    importedLots: createdLots.flat().length,
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
