import { CalculationResult, ChartStep } from '@/features/bond-core/types';
import { ComparisonAlignedTableRow } from '@/features/comparison-engine/lib/comparison-table-model';

export interface ComparisonTableProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  purchaseDate: string;
  bondTypeA: string;
  bondTypeB: string;
  formatCurrency: (val: number) => string;
  chartStep: ChartStep;
  onChartStepChange: (step: ChartStep) => void;
}

export type ComparisonSummaryRow = {
  label: string;
  a: number;
  b: number;
};

export interface ComparisonTableSummaryGridProps {
  rows: ComparisonSummaryRow[];
  bondTypeA: string;
  bondTypeB: string;
  tieLabel: string;
  formatCurrency: (val: number) => string;
}

export interface ComparisonTableTimelineRowsProps {
  rows: ComparisonAlignedTableRow[];
  bondTypeA: string;
  bondTypeB: string;
  higherColumnLabel: string;
  higherBadgeSuffix: string;
  tieLabel: string;
  formatCurrency: (val: number) => string;
  labels: {
    mobileTitle: string;
    mobileDescription: string;
    mobileTrigger: string;
    mobileCount: string;
    desktopNote: string;
    year: string;
    nominal: string;
    real: string;
    profit: string;
  };
}
