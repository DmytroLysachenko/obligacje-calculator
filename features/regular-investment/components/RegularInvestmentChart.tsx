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
import {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBondColor } from '@/shared/constants/bond-colors';

interface RegularInvestmentChartProps {
  results: RegularInvestmentResult;
  bondType: string;
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
  formatCurrency: (value: number) => string;
}

const CustomTooltip = ({ active, payload, label, formatCurrency }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border-2 border-border/50 p-4 shadow-2xl rounded-xl text-popover-foreground min-w-[200px] backdrop-blur-sm bg-opacity-95">
        <p className="font-black text-xs uppercase tracking-widest mb-3 border-b pb-2 border-border/50">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-black text-primary">{formatCurrency(Number(entry.value))}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const RegularInvestmentChart: React.FC<RegularInvestmentChartProps> = ({ results, bondType }) => {
  const { t, language } = useLanguage();
  const [view, setView] = React.useState<'nominal' | 'real'>('nominal');
  const dateLocale = language === 'pl' ? pl : enGB;
  const primaryColor = getBondColor(bondType);

  const chartData = results.timeline.map((point) => ({
    date: format(parseISO(point.date), 'MM.yy', { locale: dateLocale }),
    invested: Number(point.totalInvested.toFixed(2)),
    value: view === 'nominal' ? Number(point.nominalValue.toFixed(2)) : Number(point.realValue.toFixed(2)),
  }));

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', { 
      style: 'currency', 
      currency: 'PLN',
      maximumFractionDigits: 0 
    }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Tabs value={view} onValueChange={(v) => setView(v as 'nominal' | 'real')} className="w-fit p-1 bg-muted/50 rounded-xl">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="nominal" className="text-[10px] font-black uppercase tracking-widest px-6">{t('common.nominal_value')}</TabsTrigger>
            <TabsTrigger value="real" className="text-[10px] font-black uppercase tracking-widest px-6">{t('common.real_value')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ChartContainer height={450}>
        <ResponsiveContainer width="100%" height={450} key={`chart-${chartData.length}-${view}`}>
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
            <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
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
              dataKey="value"
              name={view === 'nominal' ? t('common.nominal_value') : t('common.real_value')}
              stroke={primaryColor}
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
