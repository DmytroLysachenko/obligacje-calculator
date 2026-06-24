'use client';

import { useCallback, useEffect, useState } from 'react';

import { UserPortfolio } from '@/db/schema';
import { portfolioClient } from '@/shared/lib/portfolio-client';
import {
  persistSelectedPortfolioId,
  removePortfolioFromNotebookState,
  upsertPortfolioInNotebookState,
} from '@/shared/lib/workspace/notebook-state';
import { resolveWorkspacePortfolioSelection } from '@/shared/lib/workspace/portfolio-selection';

interface UseWorkspacePortfoliosOptions {
  enabled?: boolean;
}

export function useWorkspacePortfolios({ enabled = true }: UseWorkspacePortfoliosOptions = {}) {
  const [portfolios, setPortfoliosState] = useState<UserPortfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [requestError, setRequestError] = useState<unknown>(null);

  const setSelectedPortfolioId = useCallback((portfolioId: string | null) => {
    setSelectedPortfolioIdState(portfolioId);
    persistSelectedPortfolioId(portfolioId);
  }, []);

  const replacePortfolios = useCallback((nextPortfolios: UserPortfolio[]) => {
    setPortfoliosState(nextPortfolios);
    setSelectedPortfolioIdState((currentSelection) => {
      const nextSelection = resolveWorkspacePortfolioSelection(
        currentSelection,
        nextPortfolios,
      ).portfolioId;
      persistSelectedPortfolioId(nextSelection);
      return nextSelection;
    });
  }, []);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setRequestError(null);

    try {
      const nextPortfolios = await portfolioClient.listPortfolios();
      replacePortfolios(Array.isArray(nextPortfolios) ? nextPortfolios : []);
      return nextPortfolios;
    } catch (error) {
      setRequestError(error);
      setPortfoliosState([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [enabled, replacePortfolios]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const upsertPortfolio = useCallback((portfolio: UserPortfolio) => {
    setPortfoliosState((current) => {
      const nextPortfolios = upsertPortfolioInNotebookState(current, portfolio);
      setSelectedPortfolioIdState((currentSelection) => {
        const nextSelection = resolveWorkspacePortfolioSelection(
          currentSelection,
          nextPortfolios,
        ).portfolioId;
        persistSelectedPortfolioId(nextSelection);
        return nextSelection;
      });
      return nextPortfolios;
    });
  }, []);

  const removePortfolio = useCallback((portfolioId: string) => {
    setPortfoliosState((current) => {
      const nextPortfolios = removePortfolioFromNotebookState(current, portfolioId);
      setSelectedPortfolioIdState((currentSelection) => {
        const nextSelection = resolveWorkspacePortfolioSelection(
          currentSelection,
          nextPortfolios,
        ).portfolioId;
        persistSelectedPortfolioId(nextSelection);
        return nextSelection;
      });
      return nextPortfolios;
    });
  }, []);

  const selectedPortfolio = selectedPortfolioId
    ? (portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? null)
    : null;

  return {
    portfolios,
    selectedPortfolioId,
    selectedPortfolio,
    isLoading,
    requestError,
    refetch,
    replacePortfolios,
    setSelectedPortfolioId,
    upsertPortfolio,
    removePortfolio,
  };
}
