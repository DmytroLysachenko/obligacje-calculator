'use client';
import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { ResultMetricCard } from '@/shared/components/results/ResultMetricCard';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { buildLadderMaturityBuckets, LadderMaturityBucket } from '@/shared/lib/ladder-display';
interface LadderTimelineProps {
    results: RegularInvestmentResult;
}
export const LadderTimeline: React.FC<LadderTimelineProps> = ({ results }) => {
    const { t, locale: language } = useAppI18n();
    const dateLocale = getDateFnsLocale(language);
    const currencyFormatter = useCurrencyFormatter(language, {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    });
    const formatCurrency = (value: number) => currencyFormatter.format(value);
    const chartData = useMemo<LadderMaturityBucket[]>(() => buildLadderMaturityBuckets(results.lots, dateLocale), [dateLocale, results.lots]);
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
      <ResultSummaryHero eyebrow={t('ladder_page.timeline.eyebrow')} value={peakMonth
            ? peakMonth.displayDate
            : t('ladder_page.timeline.no_peak_month')} description={t('ladder_page.timeline.description')} narrative={t('ladder_page.timeline.narrative')} aside={<div className="rounded-[1.4rem] border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {t('ladder_page.timeline.month_count')}
            </p>
            <p className="mt-2 text-lg font-black text-slate-900">{chartData.length}</p>
          </div>}/>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResultMetricCard label={t('ladder_page.timeline.average_maturity_value')} value={formatCurrency(averageMaturityValue)} description={t('ladder_page.timeline.average_maturity_value_description')}/>
        <ResultMetricCard label={t('ladder_page.timeline.spread_gap')} value={formatCurrency(monthlySpreadGap)} description={t('ladder_page.timeline.spread_gap_description')}/>
        <ResultMetricCard label={t('ladder_page.timeline.active_window')} value={`${earliestMonth ? earliestMonth.displayDate : '-'} ${latestMonth ? `- ${latestMonth.displayDate}` : ''}`} description={t('ladder_page.timeline.active_window_description')}/>
      </div>

      <Card className="rounded-2xl border shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-900">
            {t('ladder_page.timeline.chart_title')}
          </CardTitle>
          <CardDescription>
            {t('ladder_page.timeline.chart_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ChartSupportNote title={t('ladder_page.timeline.chart_note_title')} description={t('ladder_page.timeline.chart_note_description')}/>

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

          <ResponsiveTableSheet title={t('ladder_page.timeline.mobile_sheet_title')} description={t('ladder_page.timeline.mobile_sheet_description')} triggerLabel={t('ladder_page.timeline.mobile_sheet_trigger')} triggerCount={`${chartData.length} ${t('ladder_page.timeline.mobile_sheet_count_suffix')}`}>
            {chartData.map((item) => (<div key={`mobile-${item.date}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.displayDate}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t('ladder_page.timeline.lots_count')}: {item.count}
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-950">{formatCurrency(item.amount)}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MobileLadderValue label={t('ladder_page.timeline.mobile_share_of_lots')} value={chartData.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}/>
                  <MobileLadderValue label={t('ladder_page.timeline.mobile_amount')} value={formatCurrency(item.amount)}/>
                </div>
              </div>))}
          </ResponsiveTableSheet>

          <div className="hidden rounded-2xl border border-slate-200 bg-white lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-slate-200 px-4 py-3 text-sm text-slate-600">
              <p>
                {t('ladder_page.timeline.table_summary')}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {chartData.length} {t('ladder_page.timeline.table_count_suffix')}
              </p>
            </div>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[34%] text-xs text-slate-600">{t('ladder_page.timeline.table_month')}</TableHead>
                  <TableHead className="w-[18%] text-right text-xs text-slate-600">{t('ladder_page.timeline.table_lots')}</TableHead>
                  <TableHead className="w-[24%] text-right text-xs text-slate-600">{t('ladder_page.timeline.table_amount')}</TableHead>
                  <TableHead className="w-[24%] text-right text-xs text-slate-600">{t('ladder_page.timeline.table_share')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((item) => (<TableRow key={item.date} className="border-b border-slate-100 transition-colors odd:bg-slate-50/30 hover:bg-slate-50/70">
                    <TableCell className="font-medium text-slate-900">{item.displayDate}</TableCell>
                    <TableCell className="text-right text-slate-700">{item.count}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {chartData.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[1.4rem] border border-slate-200 px-4 py-4 text-sm leading-6 text-slate-600">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t('ladder_page.timeline.peak_month_title')}
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {peakMonth ? `${peakMonth.displayDate} (${formatCurrency(peakMonth.amount)})` : '-'}
              </p>
              <p className="mt-2">
                {t('ladder_page.timeline.peak_month_description')}
              </p>
            </div>

            <div className={peakShare >= 25
            ? 'rounded-[1.4rem] border border-amber-200 bg-amber-50/55 p-4 text-sm leading-6 text-amber-950'
            : 'rounded-[1.4rem] border border-emerald-200 bg-emerald-50/45 p-4 text-sm leading-6 text-emerald-950'}>
              <p className={peakShare >= 25
            ? 'text-[11px] font-bold uppercase tracking-wide text-amber-800'
            : 'text-[11px] font-bold uppercase tracking-wide text-emerald-800'}>
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

          <div className="rounded-[1.4rem] border border-slate-200 px-4 py-4 text-sm leading-6 text-slate-600">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {t('ladder_page.timeline.interpretation_title')}
            </p>
            <p className="mt-2">
              {t('ladder_page.timeline.interpretation_description')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>);
};
function MobileLadderValue({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div className="border-t border-dashed border-slate-200 px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>);
}





