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
import {
  defaultLadderTimelineQueryState,
  getLadderTimelineUrl,
  type LadderTimelineQueryState,
  readLadderTimelineQueryState,
} from '../lib/ladder-timeline-query';

import { LadderTimelineChartSection, LadderYearSummarySection } from './LadderTimelineSections';

export const LadderTimeline: React.FC<LadderTimelineProps> = ({ results }) => {
  const { t, locale: language } = useAppI18n();
  const [initialQueryState] = useState(() =>
    typeof window === 'undefined'
      ? defaultLadderTimelineQueryState
      : readLadderTimelineQueryState(new URLSearchParams(window.location.search)),
  );
  const [rowLimit, setRowLimit] = useState<TableRowLimit>(initialQueryState.rowLimit);
  const [chartMode, setChartMode] = useState<LadderChartMode>(initialQueryState.chartMode);
  const [tableFilter, setTableFilter] = useState<LadderTableFilter>(initialQueryState.tableFilter);
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
  const syncTimelineUrl = useCallback((nextState: LadderTimelineQueryState) => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const nextUrl = getLadderTimelineUrl(url, nextState);
    window.history.replaceState(window.history.state, '', nextUrl);
  }, []);
  const handleChartModeChange = useCallback(
    (nextChartMode: LadderChartMode) => {
      setChartMode(nextChartMode);
      syncTimelineUrl({ chartMode: nextChartMode, tableFilter, rowLimit });
    },
    [rowLimit, syncTimelineUrl, tableFilter],
  );
  const handleTableFilterChange = useCallback(
    (nextTableFilter: LadderTableFilter) => {
      setTableFilter(nextTableFilter);
      syncTimelineUrl({ chartMode, tableFilter: nextTableFilter, rowLimit });
    },
    [chartMode, rowLimit, syncTimelineUrl],
  );
  const handleRowLimitChange = useCallback(
    (nextRowLimit: TableRowLimit) => {
      setRowLimit(nextRowLimit);
      syncTimelineUrl({ chartMode, tableFilter, rowLimit: nextRowLimit });
    },
    [chartMode, syncTimelineUrl, tableFilter],
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
        filteredRows={filteredMonthlyBuckets}
        monthlyBuckets={monthlyBuckets}
        filteredRowCount={filteredMonthlyBuckets.length}
        clusteredThreshold={timelineStats.clusteredThreshold}
        tableFilter={tableFilter}
        rowLimit={rowLimit}
        totalLots={results.lots.length}
        peakMonth={timelineStats.peakMonth}
        peakShare={timelineStats.peakShare}
        onChartModeChange={handleChartModeChange}
        onTableFilterChange={handleTableFilterChange}
        onRowLimitChange={handleRowLimitChange}
        formatCurrency={formatCurrency}
        t={t}
      />
    </div>
  );
};
