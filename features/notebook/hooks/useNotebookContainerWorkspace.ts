import { useRef, useState } from 'react';

import { persistSelectedPortfolioId } from '@/shared/lib/workspace/notebook-state';
import { UserPortfolio } from '@/shared/types/portfolio';

interface UseNotebookContainerWorkspaceInput {
  fetchPortfolios: () => Promise<unknown>;
  setSelectedPortfolioId: (portfolioId: string) => void;
}

export function useNotebookContainerWorkspace({
  fetchPortfolios,
  setSelectedPortfolioId,
}: UseNotebookContainerWorkspaceInput) {
  const [portfolioPendingDelete, setPortfolioPendingDelete] = useState<UserPortfolio | null>(null);
  const [detailPortfolioId, setDetailPortfolioId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  const clearDetailPortfolio = (portfolioId: string) => {
    setDetailPortfolioId((current) => (current === portfolioId ? null : current));
  };

  const handleImportClick = () => {
    importRef.current?.click();
  };

  const handleOpenPortfolio = (portfolio: UserPortfolio) => {
    setSelectedPortfolioId(portfolio.id);
    persistSelectedPortfolioId(portfolio.id);
    setDetailPortfolioId(portfolio.id);
  };

  const handleClosePortfolioDetails = () => {
    void fetchPortfolios();
    setDetailPortfolioId(null);
  };

  return {
    portfolioPendingDelete,
    setPortfolioPendingDelete,
    detailPortfolioId,
    importRef,
    clearDetailPortfolio,
    handleImportClick,
    handleOpenPortfolio,
    handleClosePortfolioDetails,
  };
}
