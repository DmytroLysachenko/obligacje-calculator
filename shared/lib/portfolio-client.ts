import { UserInvestmentLot, UserPortfolio } from '@/db/schema';
import { PortfolioSimulationResult } from '@/features/bond-core/types/scenarios';
import { apiDelete, apiGet, apiGetWithResponse, apiPatch, apiPost } from '@/shared/lib/api-client';

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
  isRebought?: boolean;
}

export interface ImportPortfolioResult {
  portfolio?: UserPortfolio;
  importedLots?: number;
}

export interface ExportPortfolioResult {
  data: Record<string, unknown> | null;
  fileName: string;
}

export type PortfolioExportFormat = 'portfolio' | 'package';

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
  deletePortfolio(portfolioId: string) {
    return apiDelete<UserPortfolio>(`/api/portfolio?id=${portfolioId}`);
  },
  importPortfolio(input: unknown) {
    return apiPost<ImportPortfolioResult>('/api/portfolio/import', input);
  },
  createLot(input: CreatePortfolioLotInput) {
    return apiPost<UserInvestmentLot>('/api/portfolio/lots', input);
  },
  listLots(portfolioId: string) {
    return apiGet<UserInvestmentLot[]>(`/api/portfolio/lots?portfolioId=${portfolioId}`);
  },
  updateLot(lotId: string, input: Partial<CreatePortfolioLotInput>) {
    return apiPatch<UserInvestmentLot>(`/api/portfolio/lots/${lotId}`, input);
  },
  deleteLot(lotId: string) {
    return apiDelete<{ success: boolean }>(`/api/portfolio/lots/${lotId}`);
  },
  simulatePortfolio(portfolioId: string) {
    return apiPost<PortfolioSimulationResult>('/api/portfolio/simulate', { portfolioId });
  },
  toggleSharing(portfolioId: string, isPublic: boolean) {
    return apiPost<{ isPublic: boolean; shareId?: string | null }>('/api/portfolio/share', {
      portfolioId,
      isPublic,
    });
  },
  async exportPortfolio(portfolio: Pick<UserPortfolio, 'id' | 'name'>, format: PortfolioExportFormat) {
    const { data, response } = await apiGetWithResponse<Record<string, unknown>>(
      `/api/portfolio/export?portfolioId=${portfolio.id}&format=${format}`,
    );

    const fallbackName = `${portfolio.name.replace(/\s+/g, '_').toLowerCase()}_${format}.json`;
    const fileName =
      response.headers.get('content-disposition')?.match(/filename="([^"]+)"/i)?.[1] ??
      fallbackName;

    return {
      data,
      fileName,
    } satisfies ExportPortfolioResult;
  },
};
