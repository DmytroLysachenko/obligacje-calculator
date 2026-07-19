'use client';
import React, { useCallback, useMemo, useState } from 'react';

import {
  LadderChartMode,
  LadderTableFilter,
  LadderTimelineProps,
} from '@/features/ladder-strategy/types/timeline';
import { useAppI18n } from '@/i18n/client';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { TableRowLimit } from '@/shared/components/results/TableDensityControls';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';

import {
  buildLadderMetricItems,
  buildLadderTimelineBuckets,
  buildLadderYearlySummaryItems,
  getDisplayedLadderTimelineRows,
  getFilteredLadderTimelineRows,
  getLadderChartData,
  getLadderTimelineStats,
} from '../lib/ladder-timeline-model';

import { LadderTimelineChartSection, LadderYearSummarySection } from './LadderTimelineSections';

export const LadderTimeline: React.FC<LadderTimelineProps> = ({ results }) => {
  const { t, locale: language } = useAppI18n();
  const [rowLimit, setRowLimit] = useState<TableRowLimit>(12);
  const [chartMode, setChartMode] = useState<LadderChartMode>('yearly');
  const [tableFilter, setTableFilter] = useState<LadderTableFilter>('all');
  const dateLocale = getDateFnsLocale(language);
  const currencyFormatter = useCurrencyFormatter(language, {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  });
  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter],
  );
  const { monthlyBuckets, yearlyBuckets } = useMemo(
    () => buildLadderTimelineBuckets(results, dateLocale),
    [dateLocale, results],
  );
  const chartData = useMemo(
    () => getLadderChartData(chartMode, monthlyBuckets, yearlyBuckets),
    [chartMode, monthlyBuckets, yearlyBuckets],
  );
  const timelineStats = useMemo(
    () => getLadderTimelineStats(results, monthlyBuckets, yearlyBuckets),
    [monthlyBuckets, results, yearlyBuckets],
  );
  const filteredMonthlyBuckets = useMemo(() => {
    return getFilteredLadderTimelineRows({
      monthlyBuckets,
      tableFilter,
      peakMonth: timelineStats.peakMonth,
      clusteredThreshold: timelineStats.clusteredThreshold,
    });
  }, [monthlyBuckets, tableFilter, timelineStats.clusteredThreshold, timelineStats.peakMonth]);
  const displayedRows = useMemo(
    () => getDisplayedLadderTimelineRows(filteredMonthlyBuckets, rowLimit),
    [filteredMonthlyBuckets, rowLimit],
  );
  const metricItems = useMemo(
    () =>
      buildLadderMetricItems({
        averageMaturityValue: timelineStats.averageMaturityValue,
        monthlySpreadGap: timelineStats.monthlySpreadGap,
        earliestMonth: timelineStats.earliestMonth,
        latestMonth: timelineStats.latestMonth,
        formatCurrency,
        t,
      }),
    [formatCurrency, t, timelineStats],
  );
  const yearlySummaryItems = useMemo(
    () => buildLadderYearlySummaryItems(yearlyBuckets, formatCurrency, t),
    [formatCurrency, t, yearlyBuckets],
  );
  return (
    <div className="ui-compact-flow">
      <ResultSummaryHero
        eyebrow={t('ladder_page.timeline.eyebrow')}
        value={
          timelineStats.peakMonth
            ? timelineStats.peakMonth.displayDate
            : t('ladder_page.timeline.no_peak_month')
        }
        description={t('ladder_page.timeline.description')}
        narrative={t('ladder_page.timeline.narrative')}
        aside={
          <div className="ui-status-note flex-col text-foreground">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('ladder_page.timeline.month_count')}
            </p>
            <p className="financial-number mt-2 text-lg font-semibold text-foreground">
              {monthlyBuckets.length}
            </p>
          </div>
        }
      />

      <MetricStrip
        columns="grid-cols-1 md:grid-cols-3"
        items={metricItems}
        className="ui-result-panel"
      />

      <LadderYearSummarySection
        yearlySummaryItems={yearlySummaryItems}
        strongestYear={timelineStats.strongestYear}
        formatCurrency={formatCurrency}
        t={t}
      />

      <LadderTimelineChartSection
        chartMode={chartMode}
        chartData={chartData}
        displayedRows={displayedRows}
        monthlyBuckets={monthlyBuckets}
        filteredRowCount={filteredMonthlyBuckets.length}
        tableFilter={tableFilter}
        rowLimit={rowLimit}
        totalLots={results.lots.length}
        peakMonth={timelineStats.peakMonth}
        peakShare={timelineStats.peakShare}
        onChartModeChange={setChartMode}
        onTableFilterChange={setTableFilter}
        onRowLimitChange={setRowLimit}
        formatCurrency={formatCurrency}
        t={t}
      />
    </div>
  );
};
