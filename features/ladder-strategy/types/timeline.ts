import { RegularInvestmentResult } from '@/features/bond-core/types';

export interface LadderTimelineProps {
  results: RegularInvestmentResult;
}

export type LadderChartMode = 'yearly' | 'monthly';

export type LadderTableFilter = 'all' | 'peak' | 'clustered';
