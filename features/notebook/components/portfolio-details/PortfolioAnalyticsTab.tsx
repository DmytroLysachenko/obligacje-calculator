'use client';

import React from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { PortfolioSimulationResult } from '@/features/bond-core/types/scenarios';

type PortfolioAnalyticsTabProps = {
  simulation: PortfolioSimulationResult | null;
  isSimulating: boolean;
  formatCurrency: (value: number) => string;
  t: (key: string, values?: Record<string, string>) => string;
};

export function PortfolioAnalyticsTab({
  simulation,
  isSimulating,
  formatCurrency,
  t,
}: PortfolioAnalyticsTabProps) {
  return (
    <>
      <Card className="rounded-2xl border shadow-none">
        <CardHeader>
          <CardTitle>{t('notebook.projection_title')}</CardTitle>
          <CardDescription>{t('notebook.projection_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartSupportNote
            title={t('notebook.projection_read_title')}
            description={t('notebook.projection_read_desc')}
          />
          {isSimulating ? (
            <div className="flex min-h-[320px] items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('notebook.simulating_projection')}
            </div>
          ) : simulation?.aggregatedTimeline ? (
            <ChartContainer height={360}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    simulation.aggregatedTimeline.length > 240
                      ? simulation.aggregatedTimeline.filter((_, index) => index % 2 === 0)
                      : simulation.aggregatedTimeline
                  }
                  margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="portfolioNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => format(new Date(value), 'yyyy')}
                    minTickGap={48}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value as string), 'MMMM yyyy')}
                    formatter={(value: ValueType | undefined) => [
                      formatCurrency(Number(value ?? 0)),
                      t('notebook.total_value_label'),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalNetValue"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#portfolioNet)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
              {t('notebook.projection_empty')}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-2xl border bg-muted/20 p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{t('notebook.descriptive_title')}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('notebook.descriptive_desc')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
