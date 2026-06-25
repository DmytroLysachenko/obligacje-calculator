import type { MonthlyReturn } from '@/features/bond-core/constants/historical-data';
import type { AssetPerformanceSeries } from '@/features/bond-core/types/assets';

export type MultiAssetChartRow = Record<string, string | number>;

export interface MultiAssetEndingSnapshotItem {
  id: string;
  name: string;
  value: number;
}

interface MultiAssetSeriesAvailability {
  sp500?: boolean;
  gold?: boolean;
  inflation?: boolean;
  nbpRate?: boolean;
}

interface GrowthSummaryLabels {
  empty: () => string;
  populated: (values: {
    count: number;
    leader: string;
    leaderValue: string;
    trailing: string;
    trailingValue: string;
  }) => string;
}

interface DrawdownSummaryLabels {
  empty: () => string;
  populated: (values: { count: number; asset: string; drawdown: string }) => string;
}

export function createMultiAssetGrowthSummary({
  chartData,
  assets,
  formatCurrency,
  labels,
}: {
  chartData: MultiAssetChartRow[];
  assets: AssetPerformanceSeries[];
  formatCurrency: (value: number) => string;
  labels: GrowthSummaryLabels;
}) {
  const lastPoint = chartData[chartData.length - 1];

  if (!lastPoint || assets.length === 0) {
    return labels.empty();
  }

  const rankedValues = assets
    .map((asset) => ({
      name: asset.metadata.name,
      value: Number(lastPoint[asset.metadata.id] ?? 0),
    }))
    .sort((left, right) => right.value - left.value);

  const leading = rankedValues[0];
  const trailing = rankedValues[rankedValues.length - 1];

  return labels.populated({
    count: chartData.length,
    leader: leading.name,
    leaderValue: formatCurrency(leading.value),
    trailing: trailing.name,
    trailingValue: formatCurrency(trailing.value),
  });
}

export function createMultiAssetDrawdownSummary({
  chartData,
  assets,
  labels,
}: {
  chartData: MultiAssetChartRow[];
  assets: AssetPerformanceSeries[];
  labels: DrawdownSummaryLabels;
}) {
  const lastPoint = chartData[chartData.length - 1];

  if (!lastPoint || assets.length === 0) {
    return labels.empty();
  }

  const drawdowns = assets.map((asset) => ({
    name: asset.metadata.name,
    value: Math.abs(Number(lastPoint[`${asset.metadata.id}_drawdown`] ?? 0)),
  }));
  const deepest = drawdowns.reduce(
    (current, next) => (next.value > current.value ? next : current),
    drawdowns[0],
  );

  return labels.populated({
    count: chartData.length,
    asset: deepest.name,
    drawdown: deepest.value.toFixed(2),
  });
}

export function createMultiAssetGrowthLegendItems(assets: AssetPerformanceSeries[]) {
  return assets.map((asset) => ({
    label: asset.metadata.name,
    color: asset.metadata.color,
  }));
}

export function createMultiAssetDrawdownLegendItems(assets: AssetPerformanceSeries[]) {
  return assets.map((asset) => ({
    label: asset.metadata.name,
    color: asset.metadata.color,
    style: 'dashed' as const,
  }));
}

export function thinMultiAssetGrowthData(chartData: MultiAssetChartRow[]) {
  return chartData.length > 240 ? chartData.filter((_, index) => index % 2 === 0) : chartData;
}

export function createMultiAssetChartData({
  assets,
  historyData,
  showRealValue,
}: {
  assets: AssetPerformanceSeries[];
  historyData: MonthlyReturn[];
  showRealValue: boolean;
}): MultiAssetChartRow[] {
  if (!assets.length || !assets[0]?.series) {
    return [];
  }

  return assets[0].series.map((point, index) => {
    const historyPoint = historyData.find((row) => row.date === point.date);
    const row: MultiAssetChartRow = {
      date: point.date,
      inflation: historyPoint?.inflation ?? 0,
      nbp: historyPoint?.nbpRate ?? 0,
    };

    assets.forEach((asset) => {
      const seriesPoint = asset.series[index];
      if (seriesPoint) {
        row[asset.metadata.id] = showRealValue
          ? (seriesPoint.realValue ?? seriesPoint.value)
          : seriesPoint.value;
        row[`${asset.metadata.id}_drawdown`] = seriesPoint.drawdown;
      }
    });

    return row;
  });
}

export function computeMultiAssetTotalInvested({
  initialSum,
  monthlyContribution,
  periods,
}: {
  initialSum: number;
  monthlyContribution: number;
  periods: number;
}) {
  return initialSum + monthlyContribution * Math.max(periods - 1, 0);
}

export function createMultiAssetAvailabilitySummary({
  availability,
  labels,
}: {
  availability?: MultiAssetSeriesAvailability;
  labels: {
    gold: string;
    inflation: string;
  };
}) {
  return [
    availability?.sp500 ? 'S&P 500' : null,
    availability?.gold ? labels.gold : null,
    availability?.inflation ? labels.inflation : null,
    availability?.nbpRate ? 'NBP' : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export function createMultiAssetEndingSnapshot({
  assets,
  showRealValue,
}: {
  assets: AssetPerformanceSeries[];
  showRealValue: boolean;
}): MultiAssetEndingSnapshotItem[] {
  return assets
    .map((asset) => {
      const lastPoint = asset.series[asset.series.length - 1];
      const currentValue = showRealValue
        ? (lastPoint?.realValue ?? lastPoint?.value ?? 0)
        : (lastPoint?.value ?? 0);

      return {
        id: asset.metadata.id,
        name: asset.metadata.name,
        value: currentValue,
      };
    })
    .filter((asset) => asset.value > 0)
    .sort((left, right) => right.value - left.value);
}
