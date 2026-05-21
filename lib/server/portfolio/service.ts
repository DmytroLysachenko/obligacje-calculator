import {calculationService} from '@/features/bond-core/application-service';
import {ScenarioKind, type PortfolioSimulationResult} from '@/features/bond-core/types/scenarios';
import {resolveStoredBondLotContext} from '@/lib/server/bonds/offer-terms';
import {buildPortfolioSimulationPayload} from '@/lib/server/portfolio/simulation';
import {getOwnedLot, getOwnedPortfolio} from '@/lib/server/portfolio/access';
import {
  createLot,
  createPortfolio,
  deleteLotById,
  deletePortfolioById,
  findPortfolioById,
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

  const envelope = await calculationService.calculate({
    kind: ScenarioKind.PORTFOLIO_SIMULATION,
    payload: buildPortfolioSimulationPayload(lots, {expectedInflation: options?.expectedInflation ?? 3.5}),
  });

  return envelope.result;
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
