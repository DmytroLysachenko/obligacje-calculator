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
import { useLanguage } from '@/i18n';
import { useChartData } from '@/shared/hooks/useChartData';

interface InflationDataPoint {
  year: string;
  rate: number;
}

const CustomTooltip = ({ active, payload, label, t }: TooltipProps<number, string> & { t: (key: string) => string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[120px]">
        <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {t('common.inflation')}:
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

export const InflationChart = () => {
  const { t } = useLanguage();
  const { data: chartData, isLoading, isError } = useChartData<InflationDataPoint[]>('/api/charts/inflation');

  if (isLoading) {
    return <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">{t('common.loading')}</div>;
  }

  if (isError || !chartData) {
    return <div className="h-[400px] w-full flex items-center justify-center text-destructive">Failed to load data</div>;
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
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
            tickFormatter={(v) => `${v}%`}
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
    </div>
  );
};
