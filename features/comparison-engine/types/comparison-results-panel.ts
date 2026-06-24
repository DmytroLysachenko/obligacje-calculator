import { BondInputs, CalculationResult, ChartStep } from '@/features/bond-core/types';

import { ComparisonChartPoint } from '../lib/comparison-display';

export interface ComparisonResultsPanelProps {
  chartData: ComparisonChartPoint[];
  usesMixedTimelineCadence: boolean;
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  inputsA: BondInputs;
  inputsB: BondInputs;
  formatCurrency: (value: number) => string;
  language: 'pl' | 'en';
  chartStep: ChartStep;
  onChartStepChange: (step: ChartStep) => void;
  scenarioAColor: string;
  scenarioBColor: string;
}
