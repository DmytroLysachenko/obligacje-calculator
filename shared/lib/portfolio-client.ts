import { UserInvestmentLot, UserPortfolio } from '@/db/schema';
import { apiGet, apiPost } from '@/shared/lib/api-client';

export interface PortfolioAccessResponse {
  ownerId: string;
  isGuest: boolean;
  authMode: 'authenticated' | 'guest' | 'auth_unavailable_guest_fallback';
  canManageWorkspace: boolean;
}

export interface CreatePortfolioInput {
  name: string;
  description?: string;
}

export interface CreatePortfolioLotInput {
  portfolioId: string;
  bondType: string;
  selectedSeriesId?: string | null;
  purchaseDate: string;
  amount: number;
  isRebought: boolean;
}

export const portfolioClient = {
  listPortfolios() {
    return apiGet<UserPortfolio[]>('/api/portfolio');
  },
  getAccess() {
    return apiGet<PortfolioAccessResponse>('/api/portfolio/access');
  },
  createPortfolio(input: CreatePortfolioInput) {
    return apiPost<UserPortfolio>('/api/portfolio', input);
  },
  createLot(input: CreatePortfolioLotInput) {
    return apiPost<UserInvestmentLot>('/api/portfolio/lots', input);
  },
};
