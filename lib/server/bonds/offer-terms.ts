import { addMonths, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';
import {
  findActiveBondSeriesForDate,
  findBondDefinitionBySymbol,
  findBondSeriesByIdForBond,
} from '@/lib/server/bonds/offer-terms-repository';

export interface ResolvedBondOfferTerms {
  firstYearRate: number;
  margin: number;
  source: 'series' | 'definition';
  seriesCode?: string;
  emissionMonth?: string;
}

export interface ResolvedStoredBondLotContext {
  bondTypeId: string | null;
  bondSeriesId: string | null;
  seriesCode?: string;
}

function getBondDurationMonths(definition: BondDefinition) {
  return Math.max(1, Math.round(definition.duration * 12));
}

export function deriveSeriesCode(
  symbol: BondType,
  emissionMonth: string,
  definition: BondDefinition,
) {
  const maturityDate = addMonths(parseISO(emissionMonth), getBondDurationMonths(definition));
  return `${symbol}${format(maturityDate, 'MMyy')}`;
}

export function deriveSeriesWindow(emissionMonth: string, definition: BondDefinition) {
  const emissionStart = startOfMonth(parseISO(emissionMonth));
  const sellStartDate = format(emissionStart, 'yyyy-MM-dd');
  const sellEndDate = format(endOfMonth(emissionStart), 'yyyy-MM-dd');
  const maturityDate = format(
    addMonths(emissionStart, getBondDurationMonths(definition)),
    'yyyy-MM-dd',
  );

  return {
    sellStartDate,
    sellEndDate,
    maturityDate,
  };
}

export async function resolveBondOfferTerms(
  bondType: BondType,
  purchaseDate: string,
  definitions: Record<BondType, BondDefinition>,
  selectedSeriesId?: string | null,
): Promise<ResolvedBondOfferTerms> {
  const definition = definitions[bondType] ?? BOND_DEFINITIONS[bondType];
  const fallback: ResolvedBondOfferTerms = {
    firstYearRate: definition.firstYearRate,
    margin: definition.margin,
    source: 'definition',
  };

  try {
    const bond = await findBondDefinitionBySymbol(bondType);

    if (!bond) {
      return fallback;
    }

    if (selectedSeriesId && selectedSeriesId !== 'current') {
      const exactSeries = await findBondSeriesByIdForBond(selectedSeriesId, bond.id);

      if (exactSeries) {
        return {
          firstYearRate: Number(exactSeries.firstYearRate),
          margin: Number(exactSeries.baseMargin ?? 0),
          source: 'series',
          seriesCode: exactSeries.seriesCode,
          emissionMonth: exactSeries.emissionMonth,
        };
      }
    }

    const activeSeries = await findActiveBondSeriesForDate(bond.id, purchaseDate);

    if (!activeSeries) {
      return fallback;
    }

    return {
      firstYearRate: Number(activeSeries.firstYearRate),
      margin: Number(activeSeries.baseMargin ?? 0),
      source: 'series',
      seriesCode: activeSeries.seriesCode,
      emissionMonth: activeSeries.emissionMonth,
    };
  } catch (error) {
    console.error('Failed to resolve bond offer terms:', error);
    return fallback;
  }
}

export async function resolveStoredBondLotContext(
  bondType: BondType,
  purchaseDate: string,
  selectedSeriesId?: string | null,
): Promise<ResolvedStoredBondLotContext> {
  try {
    const bond = await findBondDefinitionBySymbol(bondType);

    if (!bond) {
      return { bondTypeId: null, bondSeriesId: null };
    }

    if (selectedSeriesId && selectedSeriesId !== 'current') {
      const exactSeries = await findBondSeriesByIdForBond(selectedSeriesId, bond.id);

      return {
        bondTypeId: bond.id,
        bondSeriesId: exactSeries?.id ?? null,
        seriesCode: exactSeries?.seriesCode,
      };
    }

    const activeSeries = await findActiveBondSeriesForDate(bond.id, purchaseDate);

    return {
      bondTypeId: bond.id,
      bondSeriesId: activeSeries?.id ?? null,
      seriesCode: activeSeries?.seriesCode,
    };
  } catch (error) {
    console.error('Failed to resolve stored bond lot context:', error);
    return { bondTypeId: null, bondSeriesId: null };
  }
}
