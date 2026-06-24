import { CalculationResult, ChartStep } from '@/features/bond-core/types';

export interface BondTimelineProps {
  results: CalculationResult;
  chartStep?: ChartStep;
}
