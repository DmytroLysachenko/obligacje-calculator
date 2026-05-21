'use client';
import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { ResultMetricCard } from '@/shared/components/results/ResultMetricCard';
import { ResultSummaryHero } from '@/shared/components/results/ResultSummaryHero';
import { getDateFnsLocale, getIntlLocale } from '@/i18n/locale-utils';
interface LadderTimelineProps {
    results: RegularInvestmentResult;
}
type MaturityBucket = {
    date: string;
    displayDate: string;
    amount: number;
    count: number;
};
export const LadderTimeline: React.FC<LadderTimelineProps> = ({ results }) => {
    const { t, locale: language } = useAppI18n();
    const dateLocale = getDateFnsLocale(language);
    const formatCurrency = (value: number) => new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    }).format(value);
    const chartData = useMemo<MaturityBucket[]>(() => {
        const grouped = results.lots.reduce((accumulator, lot) => {
            const maturityDate = parseISO(lot.maturityDate);
            const key = format(maturityDate, 'yyyy-MM');
            if (!accumulator[key]) {
                accumulator[key] = {
                    date: key,
                    displayDate: format(maturityDate, 'MMM yyyy', { locale: dateLocale }),
                    amount: 0,
                    count: 0,
                };
            }
            accumulator[key].amount += lot.netValue;
            accumulator[key].count += 1;
            return accumulator;
        }, {} as Record<string, MaturityBucket>);
        return Object.values(grouped).sort((left, right) => left.date.localeCompare(right.date));
    }, [dateLocale, results.lots]);
    const averageMaturityValue = chartData.length > 0
        ? chartData.reduce((accumulator, item) => accumulator + item.amount, 0) / chartData.length
        : 0;
    const monthlyContribution = results.lots.length > 0 ? results.totalInvested / results.lots.length : 0;
    const monthlySpreadGap = averageMaturityValue - monthlyContribution;
    const peakMonth = chartData.reduce<MaturityBucket | null>((currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak), null);
    const earliestMonth = chartData[0] ?? null;
    const latestMonth = chartData[chartData.length - 1] ?? null;
    const peakShare = peakMonth && results.lots.length > 0 ? (peakMonth.count / results.lots.length) * 100 : 0;
    return (<div className="space-y-6">
      <ResultSummaryHero eyebrow={t("generated.features.ladder_strategy.components.ladder_timeline.item_2")} value={peakMonth
            ? peakMonth.displayDate
            : t("generated.features.ladder_strategy.components.ladder_timeline.item_3")} description={t("generated.features.ladder_strategy.components.ladder_timeline.item_4")} narrative={t("generated.features.ladder_strategy.components.ladder_timeline.item_5")} aside={<div className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {t("generated.features.ladder_strategy.components.ladder_timeline.item_6")}
            </p>
            <p className="mt-2 text-lg font-black text-slate-900">{chartData.length}</p>
          </div>}/>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResultMetricCard label={t("generated.features.ladder_strategy.components.ladder_timeline.item_7")} value={formatCurrency(averageMaturityValue)} description={t("generated.features.ladder_strategy.components.ladder_timeline.item_8")}/>
        <ResultMetricCard label={t("generated.features.ladder_strategy.components.ladder_timeline.item_9")} value={formatCurrency(monthlySpreadGap)} description={t("generated.features.ladder_strategy.components.ladder_timeline.item_10")}/>
        <ResultMetricCard label={t("generated.features.ladder_strategy.components.ladder_timeline.item_11")} value={`${earliestMonth ? earliestMonth.displayDate : '-'} ${latestMonth ? `- ${latestMonth.displayDate}` : ''}`} description={t("generated.features.ladder_strategy.components.ladder_timeline.item_12")}/>
      </div>

      <Card className="rounded-2xl border shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-900">
            {t("generated.features.ladder_strategy.components.ladder_timeline.item_13")}
          </CardTitle>
          <CardDescription>
            {t("generated.features.ladder_strategy.components.ladder_timeline.item_14")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ChartSupportNote title={t("generated.features.ladder_strategy.components.ladder_timeline.item_15")} description={t("generated.features.ladder_strategy.components.ladder_timeline.item_16")}/>

          <ChartContainer height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
                <XAxis dataKey="displayDate" tickLine={false} axisLine={false} fontSize={11}/>
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}/>
                <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }} formatter={(value: ValueType | undefined) => [
            formatCurrency(Number(value ?? 0)),
            t("generated.features.ladder_strategy.components.ladder_timeline.item_17"),
        ]} labelFormatter={(label) => `${label}`}/>
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ResponsiveTableSheet title={t("generated.features.ladder_strategy.components.ladder_timeline.item_18")} description={t("generated.features.ladder_strategy.components.ladder_timeline.item_19")} triggerLabel={t("generated.features.ladder_strategy.components.ladder_timeline.item_20")} triggerCount={`${chartData.length} ${t("generated.features.ladder_strategy.components.ladder_timeline.item_21")}`}>
            {chartData.map((item) => (<div key={`mobile-${item.date}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.displayDate}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("generated.features.ladder_strategy.components.ladder_timeline.item_22")}: {item.count}
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-950">{formatCurrency(item.amount)}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MobileLadderValue label={t("generated.features.ladder_strategy.components.ladder_timeline.item_23")} value={chartData.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}/>
                  <MobileLadderValue label={t("generated.features.ladder_strategy.components.ladder_timeline.item_24")} value={formatCurrency(item.amount)}/>
                </div>
              </div>))}
          </ResponsiveTableSheet>

          <div className="hidden rounded-2xl border border-slate-200 bg-white lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              <p>
                {t("generated.features.ladder_strategy.components.ladder_timeline.item_25")}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {chartData.length} {t("generated.features.ladder_strategy.components.ladder_timeline.item_26")}
              </p>
            </div>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[34%] text-xs text-slate-600">{t("generated.features.ladder_strategy.components.ladder_timeline.item_27")}</TableHead>
                  <TableHead className="w-[18%] text-right text-xs text-slate-600">{t("generated.features.ladder_strategy.components.ladder_timeline.item_28")}</TableHead>
                  <TableHead className="w-[24%] text-right text-xs text-slate-600">{t("generated.features.ladder_strategy.components.ladder_timeline.item_29")}</TableHead>
                  <TableHead className="w-[24%] text-right text-xs text-slate-600">{t("generated.features.ladder_strategy.components.ladder_timeline.item_30")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((item) => (<TableRow key={item.date} className="odd:bg-slate-50/30 hover:bg-slate-50/80">
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
            <div className="rounded-2xl border bg-slate-50/70 p-4 text-sm leading-6 text-slate-600">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("generated.features.ladder_strategy.components.ladder_timeline.item_31")}
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {peakMonth ? `${peakMonth.displayDate} (${formatCurrency(peakMonth.amount)})` : '-'}
              </p>
              <p className="mt-2">
                {t("generated.features.ladder_strategy.components.ladder_timeline.item_32")}
              </p>
            </div>

            <div className={peakShare >= 25
            ? 'rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950'
            : 'rounded-2xl border bg-emerald-50/60 p-4 text-sm leading-6 text-emerald-950'}>
              <p className={peakShare >= 25
            ? 'text-[11px] font-bold uppercase tracking-wide text-amber-800'
            : 'text-[11px] font-bold uppercase tracking-wide text-emerald-800'}>
                {t("generated.features.ladder_strategy.components.ladder_timeline.item_33")}
              </p>
              <p className="mt-2 font-semibold">
                {peakMonth
            ? `${peakShare.toFixed(1)}% ${t("generated.features.ladder_strategy.components.ladder_timeline.item_34")} ${peakMonth.displayDate}.`
            : t("generated.features.ladder_strategy.components.ladder_timeline.item_35")}
              </p>
              <p className="mt-2">
                {peakShare >= 25
            ? t("generated.features.ladder_strategy.components.ladder_timeline.item_36") : t("generated.features.ladder_strategy.components.ladder_timeline.item_37")}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 text-sm leading-6 text-slate-600">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {t("generated.features.ladder_strategy.components.ladder_timeline.item_38")}
            </p>
            <p className="mt-2">
              {t("generated.features.ladder_strategy.components.ladder_timeline.item_39")}
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
    return (<div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>);
}





