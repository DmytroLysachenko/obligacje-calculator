'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { LADDER_CHART_MODES } from '@/features/ladder-strategy/constants/timeline';
import {
  LadderChartMode,
  LadderTableFilter,
  LadderTimelineProps,
} from '@/features/ladder-strategy/types/timeline';
import { useAppI18n } from '@/i18n/client';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSection } from '@/shared/components/charts/ChartSection';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import {
  applyTableRowLimit,
  TableRowLimit,
} from '@/shared/components/results/TableDensityControls';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import {
  buildLadderMaturityBuckets,
  buildLadderYearBuckets,
  LadderMaturityBucket,
  LadderYearBucket,
} from '@/shared/lib/ladder-display';

import { LadderTimelineTable } from './LadderTimelineTable';

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
  const monthlyBuckets = useMemo<LadderMaturityBucket[]>(
    () => buildLadderMaturityBuckets(results.lots, dateLocale),
    [dateLocale, results.lots],
  );
  const yearlyBuckets = useMemo<LadderYearBucket[]>(
    () => buildLadderYearBuckets(monthlyBuckets),
    [monthlyBuckets],
  );
  const chartData = useMemo(
    () => (chartMode === 'yearly' ? yearlyBuckets : monthlyBuckets),
    [chartMode, monthlyBuckets, yearlyBuckets],
  );
  const averageMaturityValue =
    monthlyBuckets.length > 0
      ? monthlyBuckets.reduce((accumulator, item) => accumulator + item.amount, 0) /
        monthlyBuckets.length
      : 0;
  const monthlyContribution =
    results.lots.length > 0 ? results.totalInvested / results.lots.length : 0;
  const monthlySpreadGap = averageMaturityValue - monthlyContribution;
  const peakMonth = monthlyBuckets.reduce<LadderMaturityBucket | null>(
    (currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak),
    null,
  );
  const earliestMonth = monthlyBuckets[0] ?? null;
  const latestMonth = monthlyBuckets[monthlyBuckets.length - 1] ?? null;
  const peakShare =
    peakMonth && results.lots.length > 0 ? (peakMonth.count / results.lots.length) * 100 : 0;
  const clusteredThreshold = Math.max(2, Math.ceil(results.lots.length * 0.08));
  const filteredMonthlyBuckets = useMemo(() => {
    if (tableFilter === 'peak') {
      return peakMonth ? monthlyBuckets.filter((item) => item.date === peakMonth.date) : [];
    }
    if (tableFilter === 'clustered') {
      return monthlyBuckets.filter((item) => item.count >= clusteredThreshold);
    }
    return monthlyBuckets;
  }, [clusteredThreshold, monthlyBuckets, peakMonth, tableFilter]);
  const displayedRows = useMemo(
    () => applyTableRowLimit(filteredMonthlyBuckets, rowLimit),
    [filteredMonthlyBuckets, rowLimit],
  );
  const strongestYear = yearlyBuckets.reduce<LadderYearBucket | null>(
    (currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak),
    null,
  );
  const metricItems = useMemo(
    () => [
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
    ],
    [averageMaturityValue, earliestMonth, formatCurrency, latestMonth, monthlySpreadGap, t],
  );
  const yearlySummaryItems = useMemo(
    () =>
      yearlyBuckets.slice(0, 4).map((bucket) => ({
        label: bucket.year,
        value: formatCurrency(bucket.amount),
        description: t('ladder_page.timeline.year_summary_description', {
          count: bucket.count,
          firstMonth: bucket.firstMonth,
          lastMonth: bucket.lastMonth,
        }),
      })),
    [formatCurrency, t, yearlyBuckets],
  );
  return (
    <div className="space-y-8">
      <ResultSummaryHero
        eyebrow={t('ladder_page.timeline.eyebrow')}
        value={peakMonth ? peakMonth.displayDate : t('ladder_page.timeline.no_peak_month')}
        description={t('ladder_page.timeline.description')}
        narrative={t('ladder_page.timeline.narrative')}
        aside={
          <div className="border-l-2 border-border px-4 py-3 text-sm text-foreground">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('ladder_page.timeline.month_count')}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{monthlyBuckets.length}</p>
          </div>
        }
      />

      <MetricStrip columns="grid-cols-1 md:grid-cols-3" items={metricItems} />

      <SectionBlock
        title={t('ladder_page.timeline.year_summary_title')}
        description={t('ladder_page.timeline.year_summary_intro')}
        className="border-y border-border py-6"
        action={
          <div className="border-l-2 border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('ladder_page.timeline.strongest_year')}
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {strongestYear
                ? `${strongestYear.year} - ${formatCurrency(strongestYear.amount)}`
                : '-'}
            </p>
          </div>
        }
      >
        <MetricStrip
          columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
          items={yearlySummaryItems}
        />
      </SectionBlock>

      <ChartSection
        title={t('ladder_page.timeline.chart_title')}
        description={
          chartMode === 'yearly'
            ? t('ladder_page.timeline.yearly_chart_description')
            : t('ladder_page.timeline.monthly_chart_description')
        }
        className="border-y border-border py-6"
        controls={
          <SegmentedControl
            value={chartMode}
            options={LADDER_CHART_MODES.map((mode) => ({
              value: mode,
              label: t(`ladder_page.timeline.chart_modes.${mode}`),
            }))}
            onValueChange={setChartMode}
            className="w-full md:w-64"
            itemClassName="h-8"
          />
        }
      >
        <p className="border-l-2 border-border bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <span className="font-semibold text-foreground">
            {t('ladder_page.timeline.chart_note_title')}
          </span>{' '}
          {t('ladder_page.timeline.chart_note_description')}
        </p>
        <ChartContainer responsiveHeightClassName="h-[320px] md:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="displayDate" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }}
                formatter={(value: ValueType | undefined) => [
                  formatCurrency(Number(value ?? 0)),
                  t('ladder_page.timeline.tooltip_amount_label'),
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <LadderTimelineTable
          displayedRows={displayedRows}
          monthlyBuckets={monthlyBuckets}
          filteredRowCount={filteredMonthlyBuckets.length}
          tableFilter={tableFilter}
          rowLimit={rowLimit}
          totalLots={results.lots.length}
          onTableFilterChange={setTableFilter}
          onRowLimitChange={setRowLimit}
          formatCurrency={formatCurrency}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormInlineNotice
            title={t('ladder_page.timeline.peak_month_title')}
            description={
              <>
                <span className="font-semibold text-foreground">
                  {peakMonth
                    ? `${peakMonth.displayDate} (${formatCurrency(peakMonth.amount)})`
                    : '-'}
                </span>{' '}
                {t('ladder_page.timeline.peak_month_description')}
              </>
            }
          />

          <FormInlineNotice
            tone={peakShare >= 25 ? 'warning' : 'success'}
            title={t('ladder_page.timeline.cluster_title')}
            description={
              <>
                <span className="font-semibold">
                  {peakMonth
                    ? t('ladder_page.timeline.cluster_value', {
                        percent: peakShare.toFixed(1),
                        month: peakMonth.displayDate,
                      })
                    : t('ladder_page.timeline.cluster_none')}
                </span>{' '}
                {peakShare >= 25
                  ? t('ladder_page.timeline.cluster_warning')
                  : t('ladder_page.timeline.cluster_ok')}
              </>
            }
          />
        </div>

        <FormInlineNotice
          title={t('ladder_page.timeline.interpretation_title')}
          description={t('ladder_page.timeline.interpretation_description')}
        />
      </ChartSection>
    </div>
  );
};
