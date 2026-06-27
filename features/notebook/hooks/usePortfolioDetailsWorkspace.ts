'use client';

import { addDays, isAfter, parseISO } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';
import { PortfolioSimulationResult } from '@/features/bond-core/types/scenarios';
import { logClientError } from '@/shared/lib/client-logger';
import { downloadJsonFile } from '@/shared/lib/csv-utils';
import { portfolioClient } from '@/shared/lib/portfolio-client';
import { UserInvestmentLot, UserPortfolio } from '@/shared/types/portfolio';

export type MaturityWindow = 30 | 90 | 180;

type UsePortfolioDetailsWorkspaceOptions = {
  portfolio: UserPortfolio;
  definitions: Record<BondType, BondDefinition> | null;
  onPortfolioUpdate?: (portfolio: UserPortfolio) => void;
};

export function usePortfolioDetailsWorkspace({
  portfolio,
  definitions,
  onPortfolioUpdate,
}: UsePortfolioDetailsWorkspaceOptions) {
  const [lots, setLots] = useState<UserInvestmentLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [simulation, setSimulation] = useState<PortfolioSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPublic, setIsPublic] = useState(portfolio.isPublic || false);
  const [isSharing, setIsSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [maturityWindowDays, setMaturityWindowDays] = useState<MaturityWindow>(90);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/shared-portfolios/${portfolio.shareId}`
      : '';

  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextLots = await portfolioClient.listLots(portfolio.id);
      setLots(Array.isArray(nextLots) ? nextLots : []);
    } catch (caughtError) {
      logClientError('Failed to fetch lots:', caughtError);
      setLots([]);
    } finally {
      setIsLoading(false);
    }
  }, [portfolio.id]);

  const runSimulation = useCallback(async () => {
    if (lots.length === 0) {
      setSimulation(null);
      return;
    }

    setIsSimulating(true);
    try {
      const nextSimulation = await portfolioClient.simulatePortfolio(portfolio.id);
      setSimulation(nextSimulation ?? null);
    } catch (caughtError) {
      logClientError('Simulation failed:', caughtError);
      setSimulation(null);
    } finally {
      setIsSimulating(false);
    }
  }, [lots.length, portfolio.id]);

  useEffect(() => {
    setIsPublic(portfolio.isPublic || false);
  }, [portfolio.id, portfolio.isPublic]);

  useEffect(() => {
    void fetchLots();
  }, [fetchLots]);

  useEffect(() => {
    void runSimulation();
  }, [runSimulation]);

  const totalValue = useMemo(
    () => lots.reduce((sum, lot) => sum + Number(lot.amount) * 100, 0),
    [lots],
  );

  const upcomingMaturities = useMemo(() => {
    if (!lots.length || !definitions) {
      return [];
    }

    return lots
      .map((lot) => {
        const definition = definitions[lot.bondType as BondType];
        if (!definition) {
          return null;
        }

        const maturityDate = addDays(
          parseISO(lot.purchaseDate),
          Math.round(definition.duration * 365),
        );

        return {
          ...lot,
          maturityDate,
          value: Number(lot.amount) * 100,
        };
      })
      .filter(
        (item): item is NonNullable<typeof item> =>
          item !== null && isAfter(item.maturityDate, new Date()),
      )
      .sort((left, right) => left.maturityDate.getTime() - right.maturityDate.getTime());
  }, [definitions, lots]);

  const filteredMaturities = useMemo(() => {
    const cutoff = addDays(new Date(), maturityWindowDays);
    return upcomingMaturities.filter((item) => item.maturityDate <= cutoff);
  }, [maturityWindowDays, upcomingMaturities]);

  const upcomingCashflow = useMemo(
    () => filteredMaturities.reduce((sum, item) => sum + item.value, 0),
    [filteredMaturities],
  );

  const nextMaturity = upcomingMaturities[0] ?? null;

  const handleToggleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      const nextIsPublic = !isPublic;
      await portfolioClient.toggleSharing(portfolio.id, nextIsPublic);
      setIsPublic(nextIsPublic);
      onPortfolioUpdate?.({
        ...portfolio,
        isPublic: nextIsPublic,
        updatedAt: new Date(),
      });
    } catch (caughtError) {
      logClientError('Failed to update sharing:', caughtError);
    } finally {
      setIsSharing(false);
    }
  }, [isPublic, onPortfolioUpdate, portfolio]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch (caughtError) {
      logClientError('Copy failed:', caughtError);
    }
  }, [shareUrl]);

  const handleExport = useCallback(
    async (formatName: 'portfolio' | 'package') => {
      try {
        const { data, fileName } = await portfolioClient.exportPortfolio(portfolio, formatName);

        downloadJsonFile(data, fileName);
      } catch (caughtError) {
        logClientError('Export failed:', caughtError);
      }
    },
    [portfolio],
  );

  return {
    lots,
    isLoading,
    simulation,
    isSimulating,
    isPublic,
    isSharing,
    justCopied,
    maturityWindowDays,
    setMaturityWindowDays,
    totalValue,
    upcomingMaturities,
    filteredMaturities,
    upcomingCashflow,
    nextMaturity,
    fetchLots,
    handleToggleShare,
    copyToClipboard,
    handleExport,
  };
}
