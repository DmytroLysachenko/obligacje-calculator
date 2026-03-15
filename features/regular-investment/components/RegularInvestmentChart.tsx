'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';

interface RegularInvestmentChartProps {
  results: RegularInvestmentResult;
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

export const RegularInvestmentChart: React.FC<RegularInvestmentChartProps> = ({ results }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pl' ? pl : enGB;

  const chartData = results.timeline.map((point) => ({
    date: format(parseISO(point.date), 'MM.yy', { locale: dateLocale }),
    invested: Number(point.totalInvested.toFixed(2)),
    nominal: Number(point.nominalValue.toFixed(2)),
    real: Number(point.realValue.toFixed(2)),
  }));

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { 
      style: 'currency', 
      currency: 'PLN',
      maximumFractionDigits: 0 
    }).format(value);

  return (
    <div className="w-full min-h-[450px] relative" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={450} key={`chart-${chartData.length}`}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
            </linearGradient>
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
            dataKey="date" 
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
            dataKey="invested"
            name={t('bonds.total_invested')}
            stroke="#94a3b8"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorInvested)"
            animationDuration={1500}
          />
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
