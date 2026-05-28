'use client';

import React from 'react';
import { LineChart } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { formatHorizonMonths } from '@/shared/lib/format-horizon';

interface RetirementResultsOverviewProps {
  chartData: Array<{ year: number; date: string; balance: number; withdrawal: number }>;
  scenarioCoverage: string | null;
  labels: Record<string, string>;
  language: 'pl' | 'en';
  inputsHorizonYears: number;
  taxStrategyLabel: string;
  totalTaxPaid: number;
  formatCurrency: (value: number) => string;
}

export function RetirementResultsOverview({
  chartData,
  scenarioCoverage,
  labels,
  language,
  inputsHorizonYears,
  taxStrategyLabel,
  totalTaxPaid,
  formatCurrency,
}: RetirementResultsOverviewProps) {
  return (
    <section className="space-y-5 rounded-[1.9rem] border border-slate-200 bg-white px-5 py-5 shadow-none md:px-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-950">
          <LineChart className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-black tracking-tight">{labels.balancePath}</h3>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">{labels.balancePathDesc}</p>
      </div>

      <div className="grid gap-0 rounded-[1.5rem] border border-slate-200 md:grid-cols-3">
        <div className="border-b border-dashed border-slate-200 px-4 py-3 md:border-b-0 md:border-r">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{labels.coverage}</p>
          <p className="mt-1 text-sm font-bold text-slate-950">
            {scenarioCoverage ?? formatHorizonMonths(inputsHorizonYears * 12, language)}
          </p>
        </div>
        <div className="border-b border-dashed border-slate-200 px-4 py-3 md:border-b-0 md:border-r">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{labels.taxWrapper}</p>
          <p className="mt-1 text-sm font-bold text-slate-950">{taxStrategyLabel}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{labels.taxPaid}</p>
          <p className="mt-1 text-sm font-bold text-slate-950">{formatCurrency(totalTaxPaid)}</p>
        </div>
      </div>

      <ChartSupportNote title={labels.howToRead} description={labels.howToReadDesc} />

      <ChartContainer responsiveHeightClassName="h-[340px] md:h-[400px] xl:h-[440px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="retirement-balance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.1}
            />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 'bold' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 'bold' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value, key) => [
                formatCurrency(Number(value || 0)),
                key === 'balance' ? labels.balance : labels.withdrawal,
              ]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#retirement-balance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </section>
  );
}
