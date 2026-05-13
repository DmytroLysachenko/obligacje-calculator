export type ChartRangePeriod = '1Y' | '5Y' | '10Y' | '30Y' | 'ALL';

function getPeriodPointCount(period: ChartRangePeriod) {
  if (period === '1Y') return 12;
  if (period === '5Y') return 60;
  if (period === '10Y') return 120;
  if (period === '30Y') return 360;
  return Number.POSITIVE_INFINITY;
}

export function sliceSeriesByPeriod<T>(
  data: T[],
  period: ChartRangePeriod,
) {
  if (period === 'ALL') {
    return data;
  }

  const pointCount = getPeriodPointCount(period);
  return data.slice(-pointCount);
}

export function sampleSeriesPoints<T>(
  data: T[],
  maxPoints: number,
) {
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
    minFloor?: number;
    minPadding?: number;
    paddingRatio?: number;
  } = {},
): [number, number] {
  if (values.length === 0) {
    return [minFloor, minFloor + Math.max(1, minPadding)];
  }

  const seriesMin = Math.min(...values);
  const seriesMax = Math.max(...values);
  const span = Math.max(seriesMax - seriesMin, minPadding);
  const padding = Math.max(minPadding, Math.round(span * paddingRatio));

  return [Math.max(minFloor, seriesMin - padding), seriesMax + padding];
}

export function computeRateDomain(values: number[]) {
  if (values.length === 0) {
    return [-1, 1] as [number, number];
  }

  const seriesMin = Math.min(...values, 0);
  const seriesMax = Math.max(...values, 1);

  return [
    Math.min(-1, Math.floor(seriesMin - 0.5)),
    Math.ceil(seriesMax + 0.5),
  ] as [number, number];
}
