import { CalculationResult, ChartStep } from '@/features/bond-core/types';
import { TableRowLimit } from '@/shared/components/results/TableDensityControls';
import { BondTimelineDisplayRow } from '@/shared/lib/bond-display';

export interface BondTimelineProps {
  results: CalculationResult;
  chartStep?: ChartStep;
}

export interface BondTimelineRowsProps {
  mobileResultsId: string;
  desktopResultsId: string;
  displayedTimeline: BondTimelineDisplayRow[];
  filteredTimelineLength: number;
  activeFilterCount: number;
  rowLimit: TableRowLimit;
  onRowLimitChange: (value: TableRowLimit) => void;
  onResetFilters: () => void;
  formatCurrency: (value: number) => string;
}
