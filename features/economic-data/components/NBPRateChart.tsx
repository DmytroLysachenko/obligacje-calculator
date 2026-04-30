'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLanguage } from '@/i18n';
import { useChartData } from '@/shared/hooks/useChartData';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';

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
}

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  t,
}: {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string;
  t: (key: string) => string;
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="min-w-[120px] rounded-none border border-border bg-popover p-3 text-popover-foreground shadow-xl">
      <p className="mb-2 border-b border-border/50 pb-1 text-xs font-bold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {t('bonds.nbp_rate_short')}:
            </span>
            <span className="font-mono font-bold">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NBPRateChart = ({ period = 'ALL' }: { period?: '1Y' | '5Y' | '10Y' | '30Y' | 'ALL' }) => {
  const { t } = useLanguage();
  const { data: response, isLoading, isError } = useChartData<ChartSeriesEnvelope<NBPRateDataPoint>>('/api/charts/nbp-rate');

  const chartData = React.useMemo(() => {
    const rawData = response?.data ?? [];
    if (period === 'ALL') return rawData;
    const count = period === '1Y' ? 12 : period === '5Y' ? 60 : period === '10Y' ? 120 : 360;
    return rawData.slice(-count);
  }, [period, response?.data]);

  if (isLoading) {
    return <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground animate-pulse">{t('common.loading')}</div>;
  }

  if (isError) {
    return <div className="flex h-[400px] w-full items-center justify-center text-destructive">{t('economic.failed_to_load')}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-bold">{t('economic.data_source')}:</span> {response?.dataSource ?? response?.source ?? 'unknown'}
        {response?.asOf ? ` | ${t('economic.as_of')}: ${response.asOf}` : ''}
        {response?.coverageStart && response?.coverageEnd ? ` | Coverage: ${response.coverageStart} -> ${response.coverageEnd}` : ''}
        {response?.usedFallback ? ` | ${t('economic.fallback_in_use')}` : ''}
      </div>
      <ChartContainer height={420}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis fontSize={12} tickFormatter={(value: number) => `${value}%`} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip t={t} />} />
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
            {chartData.length > 24 ? <Brush dataKey="date" height={22} stroke="#64748b" travellerWidth={8} /> : null}
            <Area type="stepAfter" dataKey="rate" stroke="#f59e0b" strokeWidth={3} fill="url(#colorRate)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
