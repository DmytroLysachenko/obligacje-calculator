export type ChartRangePeriod = '1Y' | '5Y' | '10Y' | '30Y' | 'ALL';

type DatedChartPoint = { date: string };

function getRangeStartDate(latestDate: Date, period: Exclude<ChartRangePeriod, 'ALL'>) {
  const monthsByPeriod: Record<Exclude<ChartRangePeriod, 'ALL'>, number> = {
    '1Y': 12,
    '5Y': 60,
    '10Y': 120,
    '30Y': 360,
  };
  const start = new Date(latestDate);
  start.setUTCMonth(start.getUTCMonth() - (monthsByPeriod[period] - 1), 1);
  return start;
}

function parseChartDate(value: string) {
  const normalized = /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Filters by calendar coverage rather than record count. CPI can be annual or
 * sparse while NBP can be monthly, so both need identical time semantics.
 */
export function sliceSeriesByPeriod<T extends DatedChartPoint>(
  data: T[],
  period: ChartRangePeriod,
) {
  if (period === 'ALL') {
    return data;
  }

  const dated = data
    .map((point) => ({ point, date: parseChartDate(point.date) }))
    .filter((entry): entry is { point: T; date: Date } => entry.date !== null)
    .toSorted((left, right) => left.date.getTime() - right.date.getTime());

  if (dated.length === 0) {
    return dated.map(({ point }) => point);
  }

  const start = getRangeStartDate(dated[dated.length - 1].date, period);
  return dated.filter((entry) => entry.date >= start).map(({ point }) => point);
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

export function computeReadableRateDomain(values: number[]): [number, number] {
  if (values.length === 0) return [-1, 1];

  const sorted = values.toSorted((left, right) => left - right);
  const percentile = sorted[Math.floor((sorted.length - 1) * 0.9)] ?? 1;
  const upper = Math.max(6, Math.ceil(percentile * 1.15));
  const lower = Math.min(-1, Math.floor((sorted[0] ?? 0) - 0.5));
  return [lower, upper];
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
