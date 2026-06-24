import { RegularInvestmentResult } from '@/features/bond-core/types';

export interface RegularInvestmentResultsSummaryProps {
  results: RegularInvestmentResult;
  dataQualityFlags?: string[];
}

export type RegularInvestmentSummaryStat = {
  label: string;
  value: string;
  helper: string;
};
