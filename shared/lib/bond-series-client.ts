import { BondType } from '@/features/bond-core/types';
import { apiGet } from '@/shared/lib/api-client';

export interface BondSeriesMetadata {
  id: string;
  seriesCode: string;
  firstYearRate: string | number;
  baseMargin: string | number;
  emissionMonth: string;
}

export const bondSeriesClient = {
  listBySymbol(symbol: BondType) {
    const params = new URLSearchParams({ symbol });
    return apiGet<BondSeriesMetadata[]>(`/api/calculate/bond-series?${params.toString()}`);
  },
};
