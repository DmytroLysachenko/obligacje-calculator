import { UserPortfolio } from '@/db/schema';

function getPortfolioTimestamp(portfolio: UserPortfolio) {
  return new Date(portfolio.updatedAt ?? portfolio.createdAt ?? 0).getTime();
}

export function sortPortfoliosByFreshness(portfolios: UserPortfolio[]) {
  return [...portfolios].sort(
    (left, right) => getPortfolioTimestamp(right) - getPortfolioTimestamp(left),
  );
}

export function upsertPortfolioInNotebookState(
  current: UserPortfolio[],
  portfolio: UserPortfolio,
) {
  const existingIndex = current.findIndex((item) => item.id === portfolio.id);

  if (existingIndex === -1) {
    return sortPortfoliosByFreshness([portfolio, ...current]);
  }

  const next = [...current];
  next[existingIndex] = portfolio;
  return sortPortfoliosByFreshness(next);
}

export function removePortfolioFromNotebookState(
  current: UserPortfolio[],
  portfolioId: string,
) {
  return current.filter((item) => item.id !== portfolioId);
}

export function resolveSelectedPortfolioId(
  currentSelection: string | null,
  portfolios: UserPortfolio[],
) {
  if (!currentSelection) {
    return null;
  }

  return portfolios.some((portfolio) => portfolio.id === currentSelection)
    ? currentSelection
    : null;
}
