import { differenceInMonths, format, parseISO } from 'date-fns';
import { RegularInvestmentResult, ChartStep } from '@/features/bond-core/types';
import { DisplayBucketMetricRow, DisplayRecentItem } from './display-model';

export function aggregateRegularTimelinePoints(
  timeline: RegularInvestmentResult['timeline'],
  chartStep: ChartStep,
) {
  if (chartStep === 'daily' || chartStep === 'monthly') {
    return timeline;
  }

  const grouped = new Map<string, RegularInvestmentResult['timeline']>();
  const firstDate = timeline[0] ? parseISO(timeline[0].date) : null;

  for (const point of timeline) {
    const date = parseISO(point.date);
    const monthsFromStart = firstDate ? Math.max(0, differenceInMonths(date, firstDate)) : 0;
    const key =
      chartStep === 'quarterly'
        ? `q-${Math.floor(monthsFromStart / 3)}`
        : `y-${Math.floor(monthsFromStart / 12)}`;

    const bucket = grouped.get(key) ?? [];
    bucket.push(point);
    grouped.set(key, bucket);
  }

  const aggregated = Array.from(grouped.values()).map((bucket) => bucket[0]);
  const terminal = timeline.at(-1);

  if (terminal && aggregated.at(-1)?.date !== terminal.date) {
    aggregated.push(terminal);
  }

  return aggregated;
}

export function buildRegularInvestmentChartPoints(
  timeline: RegularInvestmentResult['timeline'],
  chartStep: ChartStep,
  formatter: (date: Date) => string,
  view: 'nominal' | 'real',
) {
  return aggregateRegularTimelinePoints(timeline, chartStep).map((point) => ({
    date: formatter(parseISO(point.date)),
    invested: Number(point.totalInvested.toFixed(2)),
    value:
      view === 'nominal'
        ? Number(point.nominalValue.toFixed(2))
        : Number(point.realValue.toFixed(2)),
  }));
}

export interface RegularInvestmentYearBucket extends DisplayBucketMetricRow {
  year: string;
  invested: number;
  interest: number;
  tax: number;
  netValue: number;
}

export function buildRegularInvestmentYearBuckets(
  lots: RegularInvestmentResult['lots'],
): RegularInvestmentYearBucket[] {
  const grouped = new Map<string, RegularInvestmentYearBucket>();

  for (const lot of lots) {
    const year = format(parseISO(lot.purchaseDate), 'yyyy');
    const current = grouped.get(year) ?? {
      key: year,
      year,
      label: year,
      primaryValue: 0,
      count: 0,
      invested: 0,
      interest: 0,
      tax: 0,
      netValue: 0,
    };

    current.count += 1;
    current.invested += lot.investedAmount;
    current.interest += lot.accumulatedInterest;
    current.tax += lot.tax;
    current.netValue += lot.netValue;
    current.primaryValue += lot.netValue;
    grouped.set(year, current);
  }

  return Array.from(grouped.values())
    .sort((left, right) => left.year.localeCompare(right.year))
    .map((bucket) => ({
      ...bucket,
      invested: Number(bucket.invested.toFixed(2)),
      interest: Number(bucket.interest.toFixed(2)),
      tax: Number(bucket.tax.toFixed(2)),
      netValue: Number(bucket.netValue.toFixed(2)),
      primaryValue: Number(bucket.primaryValue.toFixed(2)),
    }));
}

export function buildRecentRegularInvestmentLots(
  lots: RegularInvestmentResult['lots'],
  limit: number,
): Array<DisplayRecentItem<RegularInvestmentResult['lots'][number]>> {
  return [...lots]
    .map((lot) => ({
      key: `${lot.purchaseDate}-${lot.maturityDate}-${lot.investedAmount}`,
      sortKey: parseISO(lot.purchaseDate).getTime(),
      value: lot,
    }))
    .sort((left, right) => right.sortKey - left.sortKey)
    .slice(0, limit);
}
