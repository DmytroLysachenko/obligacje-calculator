import { RegularInvestmentInputs, RegularInvestmentResult } from '@/features/bond-core/types';

export interface RegularInvestmentResultsSummaryProps {
  results: RegularInvestmentResult;
  inputs: RegularInvestmentInputs;
  dataQualityFlags?: string[];
}

export type RegularInvestmentSummaryStat = {
  label: string;
  value: string;
  helper: string;
};
