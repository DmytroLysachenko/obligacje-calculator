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
  ReferenceLine
} from 'recharts';
import { useLanguage } from '@/i18n';

// Historical Inflation Data for Poland (approximate YoY %)
const INFLATION_DATA = [
  { year: '2015', rate: -0.9 },
  { year: '2016', rate: -0.6 },
  { year: '2017', rate: 2.0 },
  { year: '2018', rate: 1.6 },
  { year: '2019', rate: 2.3 },
  { year: '2020', rate: 3.4 },
  { year: '2021', rate: 5.1 },
  { year: '2022', rate: 14.4 },
  { year: '2023', rate: 11.4 },
  { year: '2024', rate: 3.7 },
  { year: '2025', rate: 4.5 }, // Estimated
];

export const InflationChart = () => {
  const { t } = useLanguage();
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={INFLATION_DATA}>
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
          <Tooltip 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}%`, t('common.inflation')]}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
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
