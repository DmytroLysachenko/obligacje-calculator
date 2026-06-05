'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSection } from '@/shared/components/charts/ChartSection';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { applyTableRowLimit, TableDensityControls, TableRowLimit } from '@/shared/components/results/TableDensityControls';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import {
  buildLadderMaturityBuckets,
  buildLadderYearBuckets,
  LadderMaturityBucket,
  LadderYearBucket,
} from '@/shared/lib/ladder-display';
interface LadderTimelineProps {
    results: RegularInvestmentResult;
}
type LadderChartMode = 'yearly' | 'monthly';
type LadderTableFilter = 'all' | 'peak' | 'clustered';
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
    const formatCurrency = useCallback((value: number) => currencyFormatter.format(value), [currencyFormatter]);
    const monthlyBuckets = useMemo<LadderMaturityBucket[]>(() => buildLadderMaturityBuckets(results.lots, dateLocale), [dateLocale, results.lots]);
    const yearlyBuckets = useMemo<LadderYearBucket[]>(() => buildLadderYearBuckets(monthlyBuckets), [monthlyBuckets]);
    const chartData = useMemo(
        () => chartMode === 'yearly' ? yearlyBuckets : monthlyBuckets,
        [chartMode, monthlyBuckets, yearlyBuckets],
    );
    const averageMaturityValue = monthlyBuckets.length > 0
        ? monthlyBuckets.reduce((accumulator, item) => accumulator + item.amount, 0) / monthlyBuckets.length
        : 0;
    const monthlyContribution = results.lots.length > 0 ? results.totalInvested / results.lots.length : 0;
    const monthlySpreadGap = averageMaturityValue - monthlyContribution;
    const peakMonth = monthlyBuckets.reduce<LadderMaturityBucket | null>((currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak), null);
    const earliestMonth = monthlyBuckets[0] ?? null;
    const latestMonth = monthlyBuckets[monthlyBuckets.length - 1] ?? null;
    const peakShare = peakMonth && results.lots.length > 0 ? (peakMonth.count / results.lots.length) * 100 : 0;
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
    const displayedRows = useMemo(() => applyTableRowLimit(filteredMonthlyBuckets, rowLimit), [filteredMonthlyBuckets, rowLimit]);
    const strongestYear = yearlyBuckets.reduce<LadderYearBucket | null>((currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak), null);
    const metricItems = useMemo(() => [
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
    ], [averageMaturityValue, earliestMonth, formatCurrency, latestMonth, monthlySpreadGap, t]);
    const yearlySummaryItems = useMemo(() => yearlyBuckets.slice(0, 4).map((bucket) => ({
        label: bucket.year,
        value: formatCurrency(bucket.amount),
        description: t('ladder_page.timeline.year_summary_description', {
            count: bucket.count,
            firstMonth: bucket.firstMonth,
            lastMonth: bucket.lastMonth,
        }),
    })), [formatCurrency, t, yearlyBuckets]);
    return (<div className="space-y-8">
      <ResultSummaryHero
        eyebrow={t('ladder_page.timeline.eyebrow')}
        value={peakMonth
            ? peakMonth.displayDate
            : t('ladder_page.timeline.no_peak_month')}
        description={t('ladder_page.timeline.description')}
        narrative={t('ladder_page.timeline.narrative')}
        aside={<div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('ladder_page.timeline.month_count')}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{monthlyBuckets.length}</p>
          </div>}
      />

      <MetricStrip
        columns="grid-cols-1 md:grid-cols-3"
        items={metricItems}
      />

      <section className="surface-shell space-y-5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="ui-card-title">
              {t('ladder_page.timeline.year_summary_title')}
            </h2>
            <p className="ui-body max-w-3xl text-muted-foreground">
              {t('ladder_page.timeline.year_summary_intro')}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/25 px-4 py-3 text-sm leading-6 text-muted-foreground">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('ladder_page.timeline.strongest_year')}
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {strongestYear ? `${strongestYear.year} - ${formatCurrency(strongestYear.amount)}` : '-'}
            </p>
          </div>
        </div>
        <MetricStrip
          columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
          items={yearlySummaryItems}
        />
      </section>

      <ChartSection
        title={t('ladder_page.timeline.chart_title')}
        description={
          chartMode === 'yearly'
            ? t('ladder_page.timeline.yearly_chart_description')
            : t('ladder_page.timeline.monthly_chart_description')
        }
        className="surface-shell border-t-0 p-5"
        controls={(
          <div className="flex w-full items-center gap-1 rounded-md border border-border bg-muted/25 p-1 md:w-auto">
            {(['yearly', 'monthly'] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={chartMode === mode ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs font-semibold"
                onClick={() => setChartMode(mode)}
              >
                {t(`ladder_page.timeline.chart_modes.${mode}`)}
              </Button>
            ))}
          </div>
        )}
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
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
                <XAxis dataKey="displayDate" tickLine={false} axisLine={false} fontSize={11}/>
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}/>
                <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }} formatter={(value: ValueType | undefined) => [
            formatCurrency(Number(value ?? 0)),
            t('ladder_page.timeline.tooltip_amount_label'),
        ]} labelFormatter={(label) => `${label}`}/>
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ResponsiveTableSheet
            title={t('ladder_page.timeline.mobile_sheet_title')}
            description={t('ladder_page.timeline.mobile_sheet_description')}
            triggerLabel={t('ladder_page.timeline.mobile_sheet_trigger')}
            triggerCount={`${monthlyBuckets.length} ${t('ladder_page.timeline.mobile_sheet_count_suffix')}`}
          >
            {displayedRows.map((item) => (<div key={`mobile-${item.date}`} className="border-t border-border py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.displayDate}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('ladder_page.timeline.lots_count')}: {item.count}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MobileLadderValue
                    label={t('ladder_page.timeline.mobile_share_of_lots')}
                    value={monthlyBuckets.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}
                  />
                  <MobileLadderValue
                    label={t('ladder_page.timeline.mobile_amount')}
                    value={formatCurrency(item.amount)}
                  />
                </div>
              </div>))}
          </ResponsiveTableSheet>

          <div className="hidden overflow-hidden rounded-lg border border-border bg-card lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
              <p>
                {t('ladder_page.timeline.table_summary')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'peak', 'clustered'] as const).map((filter) => (
                  <Button
                    key={filter}
                    type="button"
                    size="sm"
                    variant={tableFilter === filter ? 'default' : 'outline'}
                    aria-pressed={tableFilter === filter}
                    onClick={() => setTableFilter(filter)}
                  >
                    {t(`ladder_page.timeline.table_filters.${filter}`)}
                  </Button>
                ))}
                <p className="text-xs font-semibold text-muted-foreground">
                  {filteredMonthlyBuckets.length} {t('ladder_page.timeline.table_count_suffix')}
                </p>
              </div>
            </div>
            <Table className="w-full table-fixed text-sm tabular-nums">
              <TableHeader>
                <TableRow className="h-12 hover:bg-transparent">
                  <TableHead className="sticky top-0 z-10 w-[34%] bg-background">{t('ladder_page.timeline.table_month')}</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[18%] bg-background text-right">{t('ladder_page.timeline.table_lots')}</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[24%] bg-background text-right">{t('ladder_page.timeline.table_amount')}</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[24%] bg-background text-right">{t('ladder_page.timeline.table_share')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedRows.map((item) => (<TableRow key={item.date} className="h-14 border-b border-border transition-colors hover:bg-muted/25">
                    <TableCell className="font-medium text-foreground">{item.displayDate}</TableCell>
                    <TableCell className="financial-number text-right text-foreground">{item.count}</TableCell>
                    <TableCell className="financial-number text-right font-semibold text-foreground">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="financial-number text-right text-muted-foreground">
                      {monthlyBuckets.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>
            <TableDensityControls
              value={rowLimit}
              totalRows={monthlyBuckets.length}
              visibleRows={displayedRows.length}
              onChange={setRowLimit}
              labels={{
                rowsShown: t('common.rows_shown'),
                rowsPerPage: t('common.rows_per_page'),
                all: t('common.all'),
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
              <p className="text-xs font-semibold text-muted-foreground">
                {t('ladder_page.timeline.peak_month_title')}
              </p>
              <p className="mt-2 font-semibold text-foreground">
                {peakMonth ? `${peakMonth.displayDate} (${formatCurrency(peakMonth.amount)})` : '-'}
              </p>
              <p className="mt-2">
                {t('ladder_page.timeline.peak_month_description')}
              </p>
            </div>

            <div className={peakShare >= 25
            ? 'rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm leading-6 text-foreground'
            : 'rounded-lg border border-success/30 bg-success/5 p-4 text-sm leading-6 text-foreground'}>
              <p className={peakShare >= 25
            ? 'text-xs font-semibold text-[var(--finance-warning)]'
            : 'text-xs font-semibold text-[var(--finance-success)]'}>
                {t('ladder_page.timeline.cluster_title')}
              </p>
              <p className="mt-2 font-semibold">
                {peakMonth
            ? t('ladder_page.timeline.cluster_value', { percent: peakShare.toFixed(1), month: peakMonth.displayDate })
            : t('ladder_page.timeline.cluster_none')}
              </p>
              <p className="mt-2">
                {peakShare >= 25
            ? t('ladder_page.timeline.cluster_warning') : t('ladder_page.timeline.cluster_ok')}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('ladder_page.timeline.interpretation_title')}
            </p>
            <p className="mt-2">
              {t('ladder_page.timeline.interpretation_description')}
            </p>
          </div>
      </ChartSection>
    </div>);
};
function MobileLadderValue({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div className="border-t border-border px-1 py-2 first:border-t-0">
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>);
}





