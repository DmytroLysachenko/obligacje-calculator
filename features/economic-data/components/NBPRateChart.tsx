'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useLanguage } from '@/i18n';
import { useChartData } from '@/shared/hooks/useChartData';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';

interface NBPRateDataPoint {
  date: string;
  rate: number;
}

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[120px]">
        <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                NBP Rate:
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

export const NBPRateChart = ({ period = 'ALL' }: { period?: '1Y' | '5Y' | '10Y' | 'ALL' }) => {
  const { t } = useLanguage();
  const { data: rawData, isLoading, isError } = useChartData<NBPRateDataPoint[]>('/api/charts/nbp-rate');

  const chartData = React.useMemo(() => {
    if (!rawData) return [];
    if (period === 'ALL') return rawData;
    
    // NBP rates are typically daily/weekly, let's assume monthly for filtering simplicity if it is a map
    // but the API returns what it returns. If it is high frequency, we slice more.
    // Let's assume the data is roughly monthly.
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
      <ResponsiveContainer width="100%" height={400} key={`nbp-chart-${chartData.length}`}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey="date" 
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
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
          <Area 
            type="stepAfter" 
            dataKey="rate" 
            stroke="#f59e0b" 
            strokeWidth={3}
            fill="url(#colorRate)"
            activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
