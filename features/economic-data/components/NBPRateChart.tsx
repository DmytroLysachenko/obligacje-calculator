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

interface NBPRateDataPoint {
  date: string;
  rate: number;
}

export const NBPRateChart = () => {
  const { t } = useLanguage();
  const { data: chartData, isLoading, isError } = useChartData<NBPRateDataPoint[]>('/api/charts/nbp-rate');

  if (isLoading) {
    return <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground animate-pulse">{t('common.loading')}</div>;
  }

  if (isError || !chartData) {
    return <div className="h-[400px] w-full flex items-center justify-center text-destructive">Failed to load data</div>;
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
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
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}%`, 'NBP Rate']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
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
    </div>
  );
};
