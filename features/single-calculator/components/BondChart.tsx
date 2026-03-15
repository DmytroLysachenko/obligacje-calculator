'use client';

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  TooltipProps
} from 'recharts';
import { CalculationResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';

interface BondChartProps {
  results: CalculationResult;
  initialInvestment: number;
}

const CustomTooltip = ({ active, payload, label, formatCurrency }: TooltipProps<number, string> & { formatCurrency: (val: number) => string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[150px]">
        <p className="font-bold mb-2 border-b pb-1 border-border/50">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold">{formatCurrency(entry.value as number)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const BondChart: React.FC<BondChartProps> = ({ results, initialInvestment }) => {
  const { t, language } = useLanguage();

  const chartData = [
    {
      label: 'Start',
      nominal: initialInvestment,
      real: initialInvestment,
      profit: 0,
    },
    ...results.timeline.map((point) => ({
      label: point.periodLabel,
      nominal: Number(point.nominalValueAfterInterest.toFixed(2)),
      real: Number(point.realValue.toFixed(2)),
      profit: Number(point.netProfit.toFixed(2)),
    })),
  ];

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { 
      style: 'currency', 
      currency: 'PLN',
      maximumFractionDigits: 0 
    }).format(value);

  return (
    <div className="h-[400px] w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
          <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
          <Area
            type="monotone"
            dataKey="nominal"
            name={t('common.nominal_value')}
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorNominal)"
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="real"
            name={t('common.real_value')}
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorReal)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
