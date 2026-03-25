'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps
} from 'recharts';
import {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';
import { useLanguage } from '@/i18n';
import { useChartData } from '@/shared/hooks/useChartData';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';

interface InflationDataPoint {
  year: string;
  rate: number;
}

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: NameType;
  t: (key: string) => string;
}

const CustomTooltip = ({ active, payload, label, t }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[120px]">
        <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {t('bonds.inflation_rate')}:
              </span>
              <span className="font-mono font-bold">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const InflationChart = ({ period = 'ALL' }: { period?: '1Y' | '5Y' | '10Y' | 'ALL' }) => {
  const { t } = useLanguage();
  const { data: rawData, isLoading, isError } = useChartData<InflationDataPoint[]>('/api/charts/inflation');

  const chartData = React.useMemo(() => {
    if (!rawData) return [];
    if (period === 'ALL') return rawData;
    
    const count = period === '1Y' ? 12 : period === '5Y' ? 60 : 120;
    return rawData.slice(-count);
  }, [rawData, period]);

  if (isLoading) {
    return <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">{t('common.loading')}</div>;
  }

  if (isError || !chartData) {
    return <div className="h-[400px] w-full flex items-center justify-center text-destructive">Failed to load data</div>;
  }

  return (
    <ChartContainer height={400}>
      <ResponsiveContainer width="100%" height={400} key={`inflation-chart-${chartData.length}`}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey="year" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            fontSize={12}
            tickFormatter={(v: number) => `${v}%`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip t={t} />} />
          <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
          <ReferenceLine y={2.5} label={{ value: 'NBP Target', position: 'right', fontSize: 10, fill: '#ef4444' }} stroke="#ef4444" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="rate" 
            stroke="#2563eb" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
