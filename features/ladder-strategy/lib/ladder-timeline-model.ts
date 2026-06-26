import { Locale } from 'date-fns';

import { RegularInvestmentResult } from '@/features/bond-core/types';
import { LadderChartMode, LadderTableFilter } from '@/features/ladder-strategy/types/timeline';
import { MetricStripItem } from '@/shared/components/results/MetricStrip';
import {
  applyTableRowLimit,
  TableRowLimit,
} from '@/shared/components/results/TableDensityControls';
import {
  buildLadderMaturityBuckets,
  buildLadderYearBuckets,
  LadderMaturityBucket,
  LadderYearBucket,
} from '@/shared/lib/ladder-display';

type Translate = (key: string, values?: Record<string, string | number>) => string;
type FormatCurrency = (value: number) => string;

export function buildLadderTimelineBuckets(results: RegularInvestmentResult, dateLocale: Locale) {
  const monthlyBuckets = buildLadderMaturityBuckets(results.lots, dateLocale);
  const yearlyBuckets = buildLadderYearBuckets(monthlyBuckets);

  return { monthlyBuckets, yearlyBuckets };
}

export function getLadderChartData(
  chartMode: LadderChartMode,
  monthlyBuckets: LadderMaturityBucket[],
  yearlyBuckets: LadderYearBucket[],
) {
  return chartMode === 'yearly' ? yearlyBuckets : monthlyBuckets;
}

export function getLadderTimelineStats(
  results: RegularInvestmentResult,
  monthlyBuckets: LadderMaturityBucket[],
  yearlyBuckets: LadderYearBucket[],
) {
  const averageMaturityValue =
    monthlyBuckets.length > 0
      ? monthlyBuckets.reduce((accumulator, item) => accumulator + item.amount, 0) /
        monthlyBuckets.length
      : 0;
  const monthlyContribution =
    results.lots.length > 0 ? results.totalInvested / results.lots.length : 0;
  const peakMonth = monthlyBuckets.reduce<LadderMaturityBucket | null>(
    (currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak),
    null,
  );
  const strongestYear = yearlyBuckets.reduce<LadderYearBucket | null>(
    (currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak),
    null,
  );
  const clusteredThreshold = Math.max(2, Math.ceil(results.lots.length * 0.08));

  return {
    averageMaturityValue,
    monthlyContribution,
    monthlySpreadGap: averageMaturityValue - monthlyContribution,
    peakMonth,
    earliestMonth: monthlyBuckets[0] ?? null,
    latestMonth: monthlyBuckets[monthlyBuckets.length - 1] ?? null,
    peakShare:
      peakMonth && results.lots.length > 0 ? (peakMonth.count / results.lots.length) * 100 : 0,
    clusteredThreshold,
    strongestYear,
  };
}

export function getFilteredLadderTimelineRows({
  monthlyBuckets,
  tableFilter,
  peakMonth,
  clusteredThreshold,
}: {
  monthlyBuckets: LadderMaturityBucket[];
  tableFilter: LadderTableFilter;
  peakMonth: LadderMaturityBucket | null;
  clusteredThreshold: number;
}) {
  if (tableFilter === 'peak') {
    return peakMonth ? monthlyBuckets.filter((item) => item.date === peakMonth.date) : [];
  }
  if (tableFilter === 'clustered') {
    return monthlyBuckets.filter((item) => item.count >= clusteredThreshold);
  }
  return monthlyBuckets;
}

export function getDisplayedLadderTimelineRows(
  rows: LadderMaturityBucket[],
  rowLimit: TableRowLimit,
) {
  return applyTableRowLimit(rows, rowLimit);
}

export function buildLadderMetricItems({
  averageMaturityValue,
  monthlySpreadGap,
  earliestMonth,
  latestMonth,
  formatCurrency,
  t,
}: {
  averageMaturityValue: number;
  monthlySpreadGap: number;
  earliestMonth: LadderMaturityBucket | null;
  latestMonth: LadderMaturityBucket | null;
  formatCurrency: FormatCurrency;
  t: Translate;
}): MetricStripItem[] {
  return [
    {
      label: t('ladder_page.timeline.average_maturity_value'),
      value: formatCurrency(averageMaturityValue),
      description: t('ladder_page.timeline.average_maturity_value_description'),
    },
    {
      label: t('ladder_page.timeline.spread_gap'),
      value: formatCurrency(monthlySpreadGap),
      description: t('ladder_page.timeline.spread_gap_description'),
    },
    {
      label: t('ladder_page.timeline.active_window'),
      value: `${earliestMonth ? earliestMonth.displayDate : '-'} ${latestMonth ? `- ${latestMonth.displayDate}` : ''}`,
      description: t('ladder_page.timeline.active_window_description'),
    },
  ];
}

export function buildLadderYearlySummaryItems(
  yearlyBuckets: LadderYearBucket[],
  formatCurrency: FormatCurrency,
  t: Translate,
): MetricStripItem[] {
  return yearlyBuckets.slice(0, 4).map((bucket) => ({
    label: bucket.year,
    value: formatCurrency(bucket.amount),
    description: t('ladder_page.timeline.year_summary_description', {
      count: bucket.count,
      firstMonth: bucket.firstMonth,
      lastMonth: bucket.lastMonth,
    }),
  }));
}
