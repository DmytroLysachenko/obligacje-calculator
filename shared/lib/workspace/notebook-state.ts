import { UserPortfolio } from '@/shared/types/portfolio';

import {
  getStoredCurrentPortfolioId,
  resolveCurrentPortfolioId,
  setStoredCurrentPortfolioId,
} from './current-portfolio';

function getPortfolioTimestamp(portfolio: UserPortfolio) {
  return new Date(portfolio.updatedAt ?? portfolio.createdAt ?? 0).getTime();
}

export function sortPortfoliosByFreshness(portfolios: UserPortfolio[]) {
  return [...portfolios].sort(
    (left, right) => getPortfolioTimestamp(right) - getPortfolioTimestamp(left),
  );
}

export function upsertPortfolioInNotebookState(current: UserPortfolio[], portfolio: UserPortfolio) {
  const existingIndex = current.findIndex((item) => item.id === portfolio.id);

  if (existingIndex === -1) {
    return sortPortfoliosByFreshness([portfolio, ...current]);
  }

  const next = [...current];
  next[existingIndex] = portfolio;
  return sortPortfoliosByFreshness(next);
}

export function removePortfolioFromNotebookState(current: UserPortfolio[], portfolioId: string) {
  return current.filter((item) => item.id !== portfolioId);
}

export function resolveSelectedPortfolioId(
  currentSelection: string | null,
  portfolios: UserPortfolio[],
) {
  return resolveCurrentPortfolioId(
    currentSelection ?? getStoredCurrentPortfolioId(),
    portfolios.map((portfolio) => portfolio.id),
  );
}

export function persistSelectedPortfolioId(portfolioId: string | null) {
  setStoredCurrentPortfolioId(portfolioId);
}
