'use client';

import React from 'react';
import { LineChart } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="rounded-2xl border-2 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
          <LineChart className="h-5 w-5 text-primary" />
          {labels.balancePath}
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{labels.balancePathDesc}</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase text-slate-600">{labels.coverage}</p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {scenarioCoverage ?? formatHorizonMonths(inputsHorizonYears * 12, language)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase text-slate-600">{labels.taxWrapper}</p>
            <p className="mt-1 text-sm font-bold text-slate-950">{taxStrategyLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase text-slate-600">{labels.taxPaid}</p>
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
      </CardContent>
    </Card>
  );
}
