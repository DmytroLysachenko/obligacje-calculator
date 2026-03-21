import { AssetPerformanceSeries } from "../../bond-core/types/assets";

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
}

export interface ComparisonChartProps {
  chartData: Record<string, string | number>[];
  assets: AssetPerformanceSeries[];
  showRealValue: boolean;
  formatCurrency: (val: number) => string;
}

export interface ComparisonSummaryProps {
  verdict: {
    title: string;
    text: string;
    recommendation: string;
  };
  totalInvested: number;
  durationMonths: number;
  isCalculating: boolean;
  formatCurrency: (val: number) => string;
}

export interface ComparisonAssetBreakdownProps {
  assets: AssetPerformanceSeries[];
  totalInvested: number;
  showRealValue: boolean;
  formatCurrency: (val: number) => string;
  language: 'en' | 'pl';
}
