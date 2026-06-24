import { RegularInvestmentResult } from '@/features/bond-core/types';
import { TableRowLimit } from '@/shared/components/results/TableDensityControls';
import { LadderMaturityBucket } from '@/shared/lib/ladder-display';

export interface LadderTimelineProps {
  results: RegularInvestmentResult;
}

export type LadderChartMode = 'yearly' | 'monthly';

export type LadderTableFilter = 'all' | 'peak' | 'clustered';

export interface LadderTimelineTableProps {
  displayedRows: LadderMaturityBucket[];
  monthlyBuckets: LadderMaturityBucket[];
  filteredRowCount: number;
  tableFilter: LadderTableFilter;
  rowLimit: TableRowLimit;
  totalLots: number;
  onTableFilterChange: (filter: LadderTableFilter) => void;
  onRowLimitChange: (value: TableRowLimit) => void;
  formatCurrency: (value: number) => string;
}
