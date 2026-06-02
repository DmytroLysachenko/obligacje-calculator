'use client';
import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { ResultMetricCard } from '@/shared/components/results/ResultMetricCard';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { applyTableRowLimit, TableDensityControls, TableRowLimit } from '@/shared/components/results/TableDensityControls';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { buildLadderMaturityBuckets, LadderMaturityBucket } from '@/shared/lib/ladder-display';
interface LadderTimelineProps {
    results: RegularInvestmentResult;
}
export const LadderTimeline: React.FC<LadderTimelineProps> = ({ results }) => {
    const { t, locale: language } = useAppI18n();
    const [rowLimit, setRowLimit] = useState<TableRowLimit>(12);
    const dateLocale = getDateFnsLocale(language);
    const currencyFormatter = useCurrencyFormatter(language, {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    });
    const formatCurrency = (value: number) => currencyFormatter.format(value);
    const chartData = useMemo<LadderMaturityBucket[]>(() => buildLadderMaturityBuckets(results.lots, dateLocale), [dateLocale, results.lots]);
    const displayedRows = useMemo(() => applyTableRowLimit(chartData, rowLimit), [chartData, rowLimit]);
    const averageMaturityValue = chartData.length > 0
        ? chartData.reduce((accumulator, item) => accumulator + item.amount, 0) / chartData.length
        : 0;
    const monthlyContribution = results.lots.length > 0 ? results.totalInvested / results.lots.length : 0;
    const monthlySpreadGap = averageMaturityValue - monthlyContribution;
    const peakMonth = chartData.reduce<LadderMaturityBucket | null>((currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak), null);
    const earliestMonth = chartData[0] ?? null;
    const latestMonth = chartData[chartData.length - 1] ?? null;
    const peakShare = peakMonth && results.lots.length > 0 ? (peakMonth.count / results.lots.length) * 100 : 0;
    return (<div className="space-y-6">
      <ResultSummaryHero
        eyebrow={t('ladder_page.timeline.eyebrow')}
        value={peakMonth
            ? peakMonth.displayDate
            : t('ladder_page.timeline.no_peak_month')}
        description={t('ladder_page.timeline.description')}
        narrative={t('ladder_page.timeline.narrative')}
        aside={<div className="border-t border-border py-3 text-sm text-foreground">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('ladder_page.timeline.month_count')}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{chartData.length}</p>
          </div>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResultMetricCard
          label={t('ladder_page.timeline.average_maturity_value')}
          value={formatCurrency(averageMaturityValue)}
          description={t('ladder_page.timeline.average_maturity_value_description')}
        />
        <ResultMetricCard
          label={t('ladder_page.timeline.spread_gap')}
          value={formatCurrency(monthlySpreadGap)}
          description={t('ladder_page.timeline.spread_gap_description')}
        />
        <ResultMetricCard
          label={t('ladder_page.timeline.active_window')}
          value={`${earliestMonth ? earliestMonth.displayDate : '-'} ${latestMonth ? `- ${latestMonth.displayDate}` : ''}`}
          description={t('ladder_page.timeline.active_window_description')}
        />
      </div>

      <section className="space-y-6 border-t border-border py-6">
        <div className="space-y-2">
          <h2 className="ui-card-title">
            {t('ladder_page.timeline.chart_title')}
          </h2>
          <p className="ui-body text-muted-foreground">
            {t('ladder_page.timeline.chart_description')}
          </p>
        </div>
          <ChartSupportNote
            title={t('ladder_page.timeline.chart_note_title')}
            description={t('ladder_page.timeline.chart_note_description')}
          />

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
            triggerCount={`${chartData.length} ${t('ladder_page.timeline.mobile_sheet_count_suffix')}`}
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
                    value={chartData.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}
                  />
                  <MobileLadderValue
                    label={t('ladder_page.timeline.mobile_amount')}
                    value={formatCurrency(item.amount)}
                  />
                </div>
              </div>))}
          </ResponsiveTableSheet>

          <div className="hidden overflow-hidden border-y border-border lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-sm text-muted-foreground">
              <p>
                {t('ladder_page.timeline.table_summary')}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {chartData.length} {t('ladder_page.timeline.table_count_suffix')}
              </p>
            </div>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[34%]">{t('ladder_page.timeline.table_month')}</TableHead>
                  <TableHead className="w-[18%] text-right">{t('ladder_page.timeline.table_lots')}</TableHead>
                  <TableHead className="w-[24%] text-right">{t('ladder_page.timeline.table_amount')}</TableHead>
                  <TableHead className="w-[24%] text-right">{t('ladder_page.timeline.table_share')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedRows.map((item) => (<TableRow key={item.date} className="border-b border-border transition-colors hover:bg-muted/35">
                    <TableCell className="font-medium text-foreground">{item.displayDate}</TableCell>
                    <TableCell className="text-right text-foreground">{item.count}</TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {chartData.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>
            <TableDensityControls
              value={rowLimit}
              totalRows={chartData.length}
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
            <div className="border-t border-border py-4 text-sm leading-6 text-muted-foreground">
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
            ? 'border-t border-warning py-4 text-sm leading-6 text-foreground'
            : 'border-t border-success py-4 text-sm leading-6 text-foreground'}>
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

          <div className="border-t border-border py-4 text-sm leading-6 text-muted-foreground">
            <p className="text-xs font-semibold text-muted-foreground">
              {t('ladder_page.timeline.interpretation_title')}
            </p>
            <p className="mt-2">
              {t('ladder_page.timeline.interpretation_description')}
            </p>
          </div>
      </section>
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





