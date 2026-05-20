'use client';
import React from 'react';
import { Brush, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, TooltipProps, XAxis, YAxis, } from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { tx, useLanguage } from '@/i18n';
import { useChartData } from '@/shared/hooks/useChartData';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ReferenceChartFrame } from '@/shared/components/charts/ReferenceChartFrame';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { sampleSeriesPoints, sliceSeriesByPeriod } from '@/shared/lib/chart-series';
import { getReferenceMetaItems } from '@/shared/lib/data-reference';
interface InflationDataPoint {
    date: string;
    rate: number;
}
interface ChartSeriesEnvelope<T> {
    data: T[];
    source: 'database' | 'fallback';
    usedFallback: boolean;
    asOf?: string;
    lastCheck?: string;
    coverageStart?: string;
    coverageEnd?: string;
    dataSource?: string;
    seriesName?: string;
    syncStatus?: 'success' | 'partial' | 'failed' | 'stale';
    coverageNote?: string;
    sourceUrl?: string;
}
interface PayloadEntry {
    name: string;
    value: number;
    color: string;
}
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
    active?: boolean;
    payload?: PayloadEntry[];
    label?: NameType;
    t: (key: string) => string;
}
const CustomTooltip = ({ active, payload, label, t }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length)
        return null;
    return (<div className="min-w-[140px] rounded-none border border-border bg-popover p-3 text-popover-foreground shadow-xl">
      <p className="mb-2 border-b border-border/50 pb-1 text-sm font-semibold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (<div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}/>
              {t('bonds.inflation.rate')}:
            </span>
            <span className="font-mono font-bold">{entry.value}%</span>
          </div>))}
      </div>
    </div>);
};
export const InflationChart = ({ period = 'ALL', }: {
    period?: '1Y' | '5Y' | '10Y' | '30Y' | 'ALL';
}) => {
    const { t, language } = useLanguage();
    const { data: response, isLoading, isError } = useChartData<ChartSeriesEnvelope<InflationDataPoint>>('/api/charts/inflation');
    const [scaleMode, setScaleMode] = React.useState<'readable' | 'full'>('readable');
    const chartData = React.useMemo(() => {
        const rawData = response?.data ?? [];
        return sampleSeriesPoints(sliceSeriesByPeriod(rawData, period), 160);
    }, [period, response?.data]);
    const maxRate = Math.max(...chartData.map((point) => point.rate), 0);
    const secondLargest = [...chartData.map((point) => point.rate)].sort((a, b) => b - a)[1] ?? maxRate;
    const clippedMax = Math.max(20, Math.ceil(secondLargest * 1.25));
    const yDomain: [
        number,
        number
    ] | undefined = scaleMode === 'full'
        ? undefined
        : [
            Math.min(0, Math.floor(Math.min(...chartData.map((point) => point.rate), 0))),
            Math.min(maxRate, clippedMax),
        ];
    if (isLoading) {
        return <Skeleton className="h-[470px] w-full rounded-[1.75rem]"/>;
    }
    if (isError) {
        return (<div className="flex h-[400px] w-full items-center justify-center text-destructive">
        {t('economic.failed_to_load')}
      </div>);
    }
    return (<ReferenceChartFrame metaItems={getReferenceMetaItems(response, language)} actions={<div className="flex gap-2">
          <Button type="button" size="sm" variant={scaleMode === 'readable' ? 'default' : 'outline'} onClick={() => setScaleMode('readable')} className="rounded-xl">
            {t('economic.readable_scale')}
          </Button>
          <Button type="button" size="sm" variant={scaleMode === 'full' ? 'default' : 'outline'} onClick={() => setScaleMode('full')} className="rounded-xl">
            {t('economic.full_scale')}
          </Button>
        </div>} notice={scaleMode === 'readable' && maxRate > clippedMax
            ? t('economic.inflation_scale_notice', { max: maxRate.toFixed(1) })
            : undefined} noticeTone="warning" fallbackNotice={response?.usedFallback
            ? tx("generated.features.economic_data.components.inflation_chart.item_1", undefined, language) : tx("generated.features.economic_data.components.inflation_chart.item_2", undefined, language)} fallbackTone={response?.usedFallback ? 'warning' : 'good'}>
      <ChartContainer height={420}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} minTickGap={24}/>
            <YAxis fontSize={12} tickFormatter={(value: number) => `${value}%`} tickLine={false} axisLine={false} domain={yDomain} allowDataOverflow={scaleMode === 'readable'}/>
            <Tooltip content={<CustomTooltip t={t}/>}/>
            <ReferenceLine y={0} stroke="#000" strokeWidth={1}/>
            <ReferenceLine y={2.5} label={{
            value: t('economic.nbp_target'),
            position: 'right',
            fontSize: 10,
            fill: '#ef4444',
        }} stroke="#ef4444" strokeDasharray="3 3"/>
            {chartData.length > 24 ? (<Brush dataKey="date" height={22} stroke="#64748b" travellerWidth={8}/>) : null}
            <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} dot={chartData.length <= 24
            ? { r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }
            : false} activeDot={{ r: 6, strokeWidth: 0 }}/>
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ReferenceChartFrame>);
};
