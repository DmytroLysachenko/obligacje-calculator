export type ChartRangePeriod = '1Y' | '5Y' | '10Y' | '30Y' | 'ALL';

function getPeriodPointCount(period: ChartRangePeriod) {
  if (period === '1Y') return 12;
  if (period === '5Y') return 60;
  if (period === '10Y') return 120;
  if (period === '30Y') return 360;
  return Number.POSITIVE_INFINITY;
}

export function sliceSeriesByPeriod<T>(data: T[], period: ChartRangePeriod) {
  if (period === 'ALL') {
    return data;
  }

  const pointCount = getPeriodPointCount(period);
  return data.slice(-pointCount);
}

export function sampleSeriesPoints<T>(data: T[], maxPoints: number) {
  if (data.length <= maxPoints || maxPoints <= 2) {
    return data;
  }

  const step = Math.ceil((data.length - 1) / (maxPoints - 1));
  const sampled: T[] = [];

  for (let index = 0; index < data.length; index += step) {
    sampled.push(data[index]);
  }

  const lastPoint = data[data.length - 1];
  if (sampled[sampled.length - 1] !== lastPoint) {
    sampled.push(lastPoint);
  }

  return sampled;
}

export function computeNumericDomain(
  values: number[],
  {
    minFloor = 0,
    minPadding = 1,
    paddingRatio = 0.08,
  }: {
    minFloor?: number | null;
    minPadding?: number;
    paddingRatio?: number;
  } = {},
): [number, number] {
  if (values.length === 0) {
    const floor = minFloor ?? 0;
    return [floor, floor + Math.max(1, minPadding)];
  }

  const seriesMin = Math.min(...values);
  const seriesMax = Math.max(...values);
  const span = Math.max(seriesMax - seriesMin, minPadding);
  const padding = Math.max(minPadding, Math.round(span * paddingRatio));
  const lowerBound = seriesMin - padding;

  return [minFloor === null ? lowerBound : Math.max(minFloor, lowerBound), seriesMax + padding];
}

export function computeRateDomain(values: number[]) {
  if (values.length === 0) {
    return [-1, 1] as [number, number];
  }

  const seriesMin = Math.min(...values, 0);
  const seriesMax = Math.max(...values, 1);

  return [Math.min(-1, Math.floor(seriesMin - 0.5)), Math.ceil(seriesMax + 0.5)] as [
    number,
    number,
  ];
}

export function formatMoneyAxisTick(value: number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '';
  }

  const absoluteValue = Math.abs(numericValue);

  if (absoluteValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  }

  if (absoluteValue >= 10_000) {
    return `${Math.round(numericValue / 1000)}k`;
  }

  if (absoluteValue >= 1000) {
    return `${(numericValue / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }

  return `${Math.round(numericValue)}`;
}
