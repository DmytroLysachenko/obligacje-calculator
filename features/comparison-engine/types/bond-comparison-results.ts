import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';
import {
  BondComparisonCalculationEnvelope,
  BondComparisonScenarioItem,
} from '@/features/bond-core/types/scenarios';

import { ComparisonChartPoint } from '../components/bond-comparison/display-model';

export type ComparisonResultsDashboardProps = {
  results: BondComparisonScenarioItem[];
  envelope: BondComparisonCalculationEnvelope | null;
  loading: boolean;
  isDirty: boolean;
  showRealValue: boolean;
  formatCurrency: (value: number) => string;
  chartData: ComparisonChartPoint[];
  selectedBonds: BondType[];
  leadingResult: BondComparisonScenarioItem | null;
  definitions?: Partial<Record<BondType, BondDefinition>> | null;
  language: 'en' | 'pl';
  onRecalculate: () => void;
};
