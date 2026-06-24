'use client';

import React from 'react';
import { LineChart } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-foreground">
          <LineChart className="h-5 w-5 text-foreground" />
          <h3 className="ui-section-title">{labels.balancePath}</h3>
        </div>
        <p className="ui-body max-w-3xl text-muted-foreground">{labels.balancePathDesc}</p>
      </div>

      <div className="grid gap-0 rounded-lg bg-muted/30 md:grid-cols-3">
        <div className="border-b border-dashed border-border px-4 py-3 md:border-b-0 md:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {labels.coverage}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {scenarioCoverage ?? formatHorizonMonths(inputsHorizonYears * 12, language)}
          </p>
        </div>
        <div className="border-b border-dashed border-border px-4 py-3 md:border-b-0 md:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {labels.taxWrapper}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{taxStrategyLabel}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {labels.taxPaid}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatCurrency(totalTaxPaid)}
          </p>
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
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                boxShadow: 'none',
              }}
              formatter={(value, key) => [
                formatCurrency(Number(value || 0)),
                key === 'balance' ? labels.balance : labels.withdrawal,
              ]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#111111"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#retirement-balance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </section>
  );
}
