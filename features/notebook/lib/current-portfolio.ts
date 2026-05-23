const CURRENT_PORTFOLIO_STORAGE_KEY = 'obligacje.current-portfolio-id.v1';

export function getStoredCurrentPortfolioId() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(CURRENT_PORTFOLIO_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCurrentPortfolioId(portfolioId: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!portfolioId) {
      window.localStorage.removeItem(CURRENT_PORTFOLIO_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(CURRENT_PORTFOLIO_STORAGE_KEY, portfolioId);
  } catch {
    // Storage can be unavailable in hardened browser modes.
  }
}

export function resolveCurrentPortfolioId(
  candidatePortfolioId: string | null,
  availablePortfolioIds: string[],
) {
  if (candidatePortfolioId && availablePortfolioIds.includes(candidatePortfolioId)) {
    return candidatePortfolioId;
  }

  return availablePortfolioIds[0] ?? null;
}
