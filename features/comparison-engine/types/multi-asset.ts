import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { AssetPerformanceSeries } from '@/features/bond-core/types/assets';

export interface ComparisonControlsProps {
  initialSum: number;
  updateInitialSum: (val: number) => void;
  monthlyContribution: number;
  updateMonthlyContribution: (val: number) => void;
  startYear: string;
  updateStartYear: (val: string) => void;
  startMonth: string;
  updateStartMonth: (val: string) => void;
  years: string[];
  months: string[];
  showRealValue: boolean;
  updateShowRealValue: (val: boolean) => void;
  purchasingPowerLoss: number;
  formatCurrency: (val: number) => string;
  inputs?: {
    timingMode?: 'general' | 'exact';
    purchaseDate?: string;
    withdrawalDate?: string;
    investmentHorizonMonths?: number;
  };
  updateTimingMode?: (val: 'general' | 'exact') => void;
  updatePurchaseDate?: (val: string) => void;
  updateWithdrawalDate?: (val: string) => void;
  updateHorizon?: (val: number) => void;
}

export interface MultiAssetComparisonChartProps {
  chartData: Record<string, string | number>[];
  assets: AssetPerformanceSeries[];
  showRealValue: boolean;
  formatCurrency: (val: number) => string;
}

export interface ComparisonAssetBreakdownProps {
  assets: AssetPerformanceSeries[];
  totalInvested: number;
  showRealValue: boolean;
  formatCurrency: (val: number) => string;
  language: 'en' | 'pl';
}

export interface MultiAssetTooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
  payload: {
    inflation?: number;
    nbp?: number;
    [key: string]: string | number | undefined;
  };
}

export interface MultiAssetGrowthTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: MultiAssetTooltipPayloadEntry[];
  label?: NameType;
  formatCurrency: (value: number) => string;
}

export interface MultiAssetDrawdownTooltipProps {
  active?: boolean;
  payload?: MultiAssetTooltipPayloadEntry[];
  label?: NameType;
}
