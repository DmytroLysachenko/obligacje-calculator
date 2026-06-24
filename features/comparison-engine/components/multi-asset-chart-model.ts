import type { AssetPerformanceSeries } from '@/features/bond-core/types/assets';

export type MultiAssetChartRow = Record<string, string | number>;

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
