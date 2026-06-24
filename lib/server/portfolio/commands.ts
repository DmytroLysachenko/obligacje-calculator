import { BondType } from '@/features/bond-core/types';
import { resolveStoredBondLotContext } from '@/lib/server/bonds/offer-terms';
import { getOwnedLot, getOwnedPortfolio } from '@/lib/server/portfolio/access';
import { PortfolioServiceError } from '@/lib/server/portfolio/errors';
import {
  createLot,
  createLotWithBuyTransaction,
  createPortfolio,
  deleteLotById,
  deletePortfolioById,
  findPortfolioById,
  updateLotById,
  updatePortfolioVisibility,
} from '@/lib/server/portfolio/repository';

export async function createOwnerPortfolio(
  ownerId: string,
  input: { name: string; description?: string },
) {
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
    input.bondType as BondType,
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

  const updateData: Record<string, unknown> = { ...input };

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

export async function toggleOwnerPortfolioSharing(
  ownerId: string,
  portfolioId: string,
  isPublic: boolean,
) {
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
        lot.bondType as BondType,
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
