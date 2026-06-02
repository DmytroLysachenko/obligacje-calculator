'use client';
import React from 'react';
import { Area, AreaChart, Brush, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { useAppI18n } from '@/i18n/client';
import { useChartData } from '@/shared/hooks/useChartData';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ReferenceChartFrame } from '@/shared/components/charts/ReferenceChartFrame';
import { Skeleton } from '@/components/ui/skeleton';
import { sampleSeriesPoints, sliceSeriesByPeriod } from '@/shared/lib/chart-series';
import { getReferenceMetaItems } from '@/shared/lib/data-reference';
interface NBPRateDataPoint {
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
const CustomTooltip = ({ active, payload, label, t, }: {
    active?: boolean;
    payload?: PayloadEntry[];
    label?: string;
    t: (key: string) => string;
}) => {
    if (!active || !payload || !payload.length)
        return null;
    return (<div className="min-w-[120px] rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="mb-2 border-b border-border/50 pb-1 text-sm font-semibold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (<div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}/>
              {t('bonds.nbp_rate_short')}:
            </span>
            <span className="font-mono font-bold">{entry.value}%</span>
          </div>))}
      </div>
    </div>);
};
export const NBPRateChart = ({ period = 'ALL', }: {
    period?: '1Y' | '5Y' | '10Y' | '30Y' | 'ALL';
}) => {
    const { t, locale: language } = useAppI18n();
    const { data: response, isLoading, isError } = useChartData<ChartSeriesEnvelope<NBPRateDataPoint>>('/api/charts/nbp-rate');
    const chartData = React.useMemo(() => {
        const rawData = response?.data ?? [];
        return sampleSeriesPoints(sliceSeriesByPeriod(rawData, period), 160);
    }, [period, response?.data]);
    if (isLoading) {
        return <Skeleton className="h-[470px] w-full rounded-lg"/>;
    }
    if (isError) {
        return (<div className="flex h-[400px] w-full items-center justify-center text-destructive">
        {t('economic.failed_to_load')}
      </div>);
    }
    return (<ReferenceChartFrame sourceLabel={t('economic.compact_source_header')} metaItems={getReferenceMetaItems(response, language)} fallbackNotice={response?.usedFallback
            ? t('economic.fallback_notices.nbp_warning') : t('economic.fallback_notices.nbp_live')} fallbackTone={response?.usedFallback ? 'warning' : 'good'}>
      <ChartContainer height={420}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C89D4F" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#C89D4F" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} minTickGap={24}/>
            <YAxis fontSize={12} tickFormatter={(value: number) => `${value}%`} tickLine={false} axisLine={false}/>
            <Tooltip content={<CustomTooltip t={t}/>}/>
            <ReferenceLine y={0} stroke="#000" strokeWidth={1}/>
            {chartData.length > 24 ? (<Brush dataKey="date" height={22} stroke="#5C5C5C" travellerWidth={8}/>) : null}
            <Area type="stepAfter" dataKey="rate" stroke="#C89D4F" strokeWidth={2} fill="url(#colorRate)" activeDot={{ r: 6, strokeWidth: 0, fill: '#C89D4F' }}/>
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ReferenceChartFrame>);
};





