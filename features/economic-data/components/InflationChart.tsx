'use client';

import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
  Brush,
} from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { useLanguage } from '@/i18n';
import { useChartData } from '@/shared/hooks/useChartData';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { Button } from '@/components/ui/button';

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
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="min-w-[140px] rounded-none border border-border bg-popover p-3 text-popover-foreground shadow-xl">
      <p className="mb-2 border-b border-border/50 pb-1 text-xs font-bold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {t('bonds.inflation_rate')}:
            </span>
            <span className="font-mono font-bold">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InflationChart = ({ period = 'ALL' }: { period?: '1Y' | '5Y' | '10Y' | '30Y' | 'ALL' }) => {
  const { t } = useLanguage();
  const { data: response, isLoading, isError } = useChartData<ChartSeriesEnvelope<InflationDataPoint>>('/api/charts/inflation');
  const [scaleMode, setScaleMode] = React.useState<'readable' | 'full'>('readable');

  const chartData = React.useMemo(() => {
    const rawData = response?.data ?? [];
    if (period === 'ALL') return rawData;
    const count = period === '1Y' ? 12 : period === '5Y' ? 60 : period === '10Y' ? 120 : 360;
    return rawData.slice(-count);
  }, [period, response?.data]);

  const maxRate = Math.max(...chartData.map((point) => point.rate), 0);
  const secondLargest = [...chartData.map((point) => point.rate)].sort((a, b) => b - a)[1] ?? maxRate;
  const clippedMax = Math.max(20, Math.ceil(secondLargest * 1.25));
  const yDomain: [number, number] | undefined =
    scaleMode === 'full'
      ? undefined
      : [Math.min(0, Math.floor(Math.min(...chartData.map((point) => point.rate), 0))), Math.min(maxRate, clippedMax)];

  if (isLoading) {
    return <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground animate-pulse">{t('common.loading')}</div>;
  }

  if (isError) {
    return <div className="flex h-[400px] w-full items-center justify-center text-destructive">{t('economic.failed_to_load')}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <span>
          <span className="font-bold">{t('economic.data_source')}:</span> {response?.dataSource ?? response?.source ?? 'unknown'}
          {response?.asOf ? ` | ${t('economic.as_of')}: ${response.asOf}` : ''}
          {response?.coverageStart && response?.coverageEnd ? ` | Coverage: ${response.coverageStart} -> ${response.coverageEnd}` : ''}
          {response?.usedFallback ? ` | ${t('economic.fallback_in_use')}` : ''}
        </span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={scaleMode === 'readable' ? 'default' : 'outline'} onClick={() => setScaleMode('readable')}>
            {t('economic.readable_scale')}
          </Button>
          <Button type="button" size="sm" variant={scaleMode === 'full' ? 'default' : 'outline'} onClick={() => setScaleMode('full')}>
            {t('economic.full_scale')}
          </Button>
        </div>
      </div>

      {scaleMode === 'readable' && maxRate > clippedMax ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          {t('economic.inflation_scale_notice', { max: maxRate.toFixed(1) })}
        </div>
      ) : null}

      <ChartContainer height={420}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis fontSize={12} tickFormatter={(value: number) => `${value}%`} tickLine={false} axisLine={false} domain={yDomain} allowDataOverflow={scaleMode === 'readable'} />
            <Tooltip content={<CustomTooltip t={t} />} />
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
            <ReferenceLine y={2.5} label={{ value: t('economic.nbp_target'), position: 'right', fontSize: 10, fill: '#ef4444' }} stroke="#ef4444" strokeDasharray="3 3" />
            {chartData.length > 24 ? <Brush dataKey="date" height={22} stroke="#64748b" travellerWidth={8} /> : null}
            <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} dot={chartData.length <= 24 ? { r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' } : false} activeDot={{ r: 6, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
