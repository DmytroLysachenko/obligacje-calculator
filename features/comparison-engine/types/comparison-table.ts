import { CalculationResult } from '@/features/bond-core/types';

export interface ComparisonTableProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  purchaseDate: string;
  bondTypeA: string;
  bondTypeB: string;
  formatCurrency: (val: number) => string;
}

export type ComparisonSummaryRow = {
  label: string;
  a: number;
  b: number;
};
