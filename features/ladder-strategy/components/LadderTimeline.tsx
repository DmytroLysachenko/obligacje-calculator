'use client';

import React, { useMemo } from 'react';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Calendar, Coins, TrendingUp } from 'lucide-react';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';

interface LadderTimelineProps {
  results: RegularInvestmentResult;
}

type MaturityBucket = {
  date: string;
  displayDate: string;
  amount: number;
  count: number;
};

export const LadderTimeline: React.FC<LadderTimelineProps> = ({ results }) => {
  const { language } = useLanguage();
  const dateLocale = language === 'pl' ? pl : enGB;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(value);

  const chartData = useMemo<MaturityBucket[]>(() => {
    const grouped = results.lots.reduce((accumulator, lot) => {
      const maturityDate = parseISO(lot.maturityDate);
      const key = format(maturityDate, 'yyyy-MM');

      if (!accumulator[key]) {
        accumulator[key] = {
          date: key,
          displayDate: format(maturityDate, 'MMM yyyy', { locale: dateLocale }),
          amount: 0,
          count: 0,
        };
      }

      accumulator[key].amount += lot.netValue;
      accumulator[key].count += 1;
      return accumulator;
    }, {} as Record<string, MaturityBucket>);

    return Object.values(grouped).sort((left, right) => left.date.localeCompare(right.date));
  }, [dateLocale, results.lots]);

  const averageMaturityValue =
    chartData.length > 0
      ? chartData.reduce((accumulator, item) => accumulator + item.amount, 0) / chartData.length
      : 0;

  const monthlyContribution = results.lots.length > 0 ? results.totalInvested / results.lots.length : 0;
  const monthlySpreadGap = averageMaturityValue - monthlyContribution;
  const peakMonth = chartData.reduce<MaturityBucket | null>(
    (currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak),
    null,
  );
  const earliestMonth = chartData[0] ?? null;
  const latestMonth = chartData[chartData.length - 1] ?? null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Coins className="h-4 w-4" />
              Average maturity month
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(averageMaturityValue)}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Average net cash that returns in each maturity month.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Average month vs contribution
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(monthlySpreadGap)}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Positive values mean average maturity cash is above the typical lot contribution.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Ladder coverage
            </p>
            <p className="text-xl font-semibold text-foreground">
              {earliestMonth ? earliestMonth.displayDate : '-'} {latestMonth ? `- ${latestMonth.displayDate}` : ''}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              First and last maturity month visible in the current scenario.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Maturity schedule</CardTitle>
          <CardDescription>
            Use the chart for spacing, then confirm exact month totals in the table below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ChartContainer height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="displayDate" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }}
                  formatter={(value: ValueType | undefined) => [
                    formatCurrency(Number(value ?? 0)),
                    'Net value',
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Lots maturing</TableHead>
                <TableHead className="text-right">Net cash</TableHead>
                <TableHead className="text-right">Share of timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((item) => (
                <TableRow key={item.date}>
                  <TableCell className="font-medium">{item.displayDate}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {chartData.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="rounded-2xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
            <p>
              Peak maturity month:{' '}
              <span className="font-semibold text-foreground">
                {peakMonth ? `${peakMonth.displayDate} (${formatCurrency(peakMonth.amount)})` : '-'}
              </span>
            </p>
            <p className="mt-2">
              If most maturities cluster in one period, the ladder is less even than it looks from a
              single top-line return number.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
