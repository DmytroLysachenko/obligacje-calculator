export interface WorkspacePortfolioOption {
  id: string;
  name: string;
}

export type WorkspaceSelectionSource = 'explicit' | 'fallback' | 'empty';

export interface WorkspacePortfolioSelection<TPortfolio extends WorkspacePortfolioOption> {
  portfolio: TPortfolio | null;
  portfolioId: string | null;
  source: WorkspaceSelectionSource;
}

export function resolveWorkspacePortfolioSelection<TPortfolio extends WorkspacePortfolioOption>(
  requestedPortfolioId: string | null,
  portfolios: TPortfolio[],
): WorkspacePortfolioSelection<TPortfolio> {
  if (portfolios.length === 0) {
    return {
      portfolio: null,
      portfolioId: null,
      source: 'empty',
    };
  }

  const requested = requestedPortfolioId
    ? portfolios.find((portfolio) => portfolio.id === requestedPortfolioId)
    : null;

  if (requested) {
    return {
      portfolio: requested,
      portfolioId: requested.id,
      source: 'explicit',
    };
  }

  const fallback = portfolios[0];

  return {
    portfolio: fallback,
    portfolioId: fallback.id,
    source: 'fallback',
  };
}

export function getWorkspaceSelectionLabel<TPortfolio extends WorkspacePortfolioOption>(
  selection: WorkspacePortfolioSelection<TPortfolio>,
  emptyLabel: string,
) {
  return selection.portfolio?.name ?? emptyLabel;
}

export function shouldPersistWorkspaceSelection<TPortfolio extends WorkspacePortfolioOption>(
  selection: WorkspacePortfolioSelection<TPortfolio>,
) {
  return selection.source === 'explicit' || selection.source === 'fallback';
}

export function getWorkspaceSaveTarget<TPortfolio extends WorkspacePortfolioOption>(
  requestedPortfolioId: string | null,
  portfolios: TPortfolio[],
) {
  const selection = resolveWorkspacePortfolioSelection(requestedPortfolioId, portfolios);

  return {
    portfolioId: selection.portfolioId,
    portfolioName: selection.portfolio?.name ?? null,
    needsPortfolioCreation: selection.source === 'empty',
    shouldPersistSelection: shouldPersistWorkspaceSelection(selection),
  };
}
