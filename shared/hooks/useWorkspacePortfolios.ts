'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPortfolio } from '@/db/schema';
import { unwrapApiData } from '@/shared/lib/api-response';
import {
  persistSelectedPortfolioId,
  removePortfolioFromNotebookState,
  resolveSelectedPortfolioId,
  upsertPortfolioInNotebookState,
} from '@/shared/lib/workspace/notebook-state';

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
      const nextSelection = resolveSelectedPortfolioId(currentSelection, nextPortfolios);
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
      const response = await fetch('/api/portfolio');
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw payload ?? new Error('Workspace portfolios request failed.');
      }

      const nextPortfolios = unwrapApiData<UserPortfolio[]>(payload) ?? [];
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
        const nextSelection = resolveSelectedPortfolioId(currentSelection, nextPortfolios);
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
        const nextSelection = resolveSelectedPortfolioId(currentSelection, nextPortfolios);
        persistSelectedPortfolioId(nextSelection);
        return nextSelection;
      });
      return nextPortfolios;
    });
  }, []);

  return {
    portfolios,
    selectedPortfolioId,
    isLoading,
    requestError,
    refetch,
    replacePortfolios,
    setSelectedPortfolioId,
    upsertPortfolio,
    removePortfolio,
  };
}
