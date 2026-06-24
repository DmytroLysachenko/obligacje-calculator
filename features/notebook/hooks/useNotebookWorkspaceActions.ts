'use client';

import React, { useCallback, useState } from 'react';
import { UserPortfolio } from '@/db/schema';
import { ApiClientError } from '@/shared/lib/api-client';
import { portfolioClient } from '@/shared/lib/portfolio-client';
import {
  NOTEBOOK_DEMO_LOTS,
  resolveNotebookPortfolioError,
} from '@/features/notebook/lib/notebook-workspace-model';

interface NotebookWorkspaceActionLabels {
  myFirstPortfolio: string;
  defaultDescription: string;
  demoName: string;
  demoDescription: string;
  createdSuccess: string;
  demoLoadedSuccess: string;
  importCompleted: (count: string) => string;
  importFailed: string;
  deleteSuccess: string;
  deleteFailed: string;
  storageUnavailable: string;
  createError: string;
}

interface UseNotebookWorkspaceActionsInput {
  labels: NotebookWorkspaceActionLabels;
  fetchPortfolios: () => Promise<unknown>;
  mergePortfolioIntoState: (portfolio: UserPortfolio) => void;
  removePortfolioFromState: (portfolioId: string) => void;
  setSelectedPortfolioId: (portfolioId: string) => void;
  clearDetailPortfolio: (portfolioId: string) => void;
}

export function useNotebookWorkspaceActions({
  labels,
  fetchPortfolios,
  mergePortfolioIntoState,
  removePortfolioFromState,
  setSelectedPortfolioId,
  clearDetailPortfolio,
}: UseNotebookWorkspaceActionsInput) {
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const resolvePortfolioError = useCallback(
    (
      payload?: {
        error?: string;
        code?: string;
      } | null,
    ) =>
      resolveNotebookPortfolioError(payload, {
        storageUnavailable: labels.storageUnavailable,
        createError: labels.createError,
      }),
    [labels.createError, labels.storageUnavailable],
  );

  const resolveCaughtPortfolioError = useCallback(
    (caughtError: unknown) => {
      if (caughtError instanceof ApiClientError) {
        return resolvePortfolioError({
          error: caughtError.message,
          code: caughtError.code,
        });
      }
      return labels.createError;
    },
    [labels.createError, resolvePortfolioError],
  );

  const handleCreateDefault = async () => {
    setIsMutating(true);
    try {
      const created = await portfolioClient.createPortfolio({
        name: labels.myFirstPortfolio,
        description: labels.defaultDescription,
      });
      setError(null);
      setStatusMessage(labels.createdSuccess);
      if (created?.id) {
        mergePortfolioIntoState(created);
        setSelectedPortfolioId(created.id);
      } else {
        await fetchPortfolios();
      }
    } catch (caughtError) {
      console.error(caughtError);
      setError(resolveCaughtPortfolioError(caughtError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreateDemo = async () => {
    setIsMutating(true);
    try {
      const createdPortfolio = await portfolioClient.createPortfolio({
        name: labels.demoName,
        description: labels.demoDescription,
      });
      const portfolioId = createdPortfolio?.id;
      if (!portfolioId) {
        await fetchPortfolios();
        return;
      }
      for (const lot of NOTEBOOK_DEMO_LOTS) {
        await portfolioClient.createLot({ portfolioId, ...lot });
      }
      mergePortfolioIntoState(createdPortfolio);
      setSelectedPortfolioId(createdPortfolio.id);
      setStatusMessage(labels.demoLoadedSuccess);
    } catch (caughtError) {
      console.error(caughtError);
      setError(resolveCaughtPortfolioError(caughtError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setIsMutating(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const importPayload = await portfolioClient.importPortfolio(parsed);
      setError(null);
      if (importPayload?.portfolio?.id) {
        mergePortfolioIntoState(importPayload.portfolio);
        setSelectedPortfolioId(importPayload.portfolio.id);
        setStatusMessage(labels.importCompleted(String(importPayload.importedLots ?? 0)));
      } else {
        await fetchPortfolios();
      }
    } catch (caughtError) {
      console.error(caughtError);
      setError(labels.importFailed);
    } finally {
      setIsMutating(false);
      event.target.value = '';
    }
  };

  const handleDeletePortfolio = async (portfolio: UserPortfolio) => {
    setIsMutating(true);
    try {
      await portfolioClient.deletePortfolio(portfolio.id);
      removePortfolioFromState(portfolio.id);
      clearDetailPortfolio(portfolio.id);
      setError(null);
      setStatusMessage(labels.deleteSuccess);
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        caughtError instanceof ApiClientError
          ? resolveCaughtPortfolioError(caughtError)
          : labels.deleteFailed,
      );
    } finally {
      setIsMutating(false);
    }
  };

  return {
    error,
    setError,
    statusMessage,
    setStatusMessage,
    isMutating,
    resolvePortfolioError,
    handleCreateDefault,
    handleCreateDemo,
    handleImportFile,
    handleDeletePortfolio,
  };
}
