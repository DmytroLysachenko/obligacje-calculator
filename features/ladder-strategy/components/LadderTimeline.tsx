'use client';

import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { enGB, pl } from 'date-fns/locale';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ResultMetricCard } from '@/shared/components/ResultMetricCard';
import { ResultSummaryHero } from '@/shared/components/ResultSummaryHero';

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

  const monthlyContribution =
    results.lots.length > 0 ? results.totalInvested / results.lots.length : 0;
  const monthlySpreadGap = averageMaturityValue - monthlyContribution;
  const peakMonth = chartData.reduce<MaturityBucket | null>(
    (currentPeak, item) => (!currentPeak || item.amount > currentPeak.amount ? item : currentPeak),
    null,
  );
  const earliestMonth = chartData[0] ?? null;
  const latestMonth = chartData[chartData.length - 1] ?? null;
  const peakShare =
    peakMonth && results.lots.length > 0 ? (peakMonth.count / results.lots.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <ResultSummaryHero
        eyebrow={language === 'pl' ? 'Podsumowanie drabiny' : 'Ladder summary'}
        value={
          peakMonth
            ? peakMonth.displayDate
            : language === 'pl'
              ? 'Brak okna zapadalnosci'
              : 'No maturity window'
        }
        description={
          language === 'pl'
            ? 'Najpierw sprawdz miesiac szczytowej zapadalnosci. Potem przeczytaj zakres i kontrole koncentracji, aby ocenic czy zwroty gotowki sa rozlozone rowno.'
            : 'Peak maturity month first. Then read the coverage window and concentration check to see whether cash returns are spread evenly or clustered too tightly.'
        }
        narrative={
          language === 'pl'
            ? 'Drabina nie jest tylko o wyniku koncowym. Liczy sie to, kiedy i jak gesto wraca gotowka.'
            : 'A ladder is not only about the final outcome. It is about when and how densely cash returns.'
        }
        aside={
          <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {language === 'pl' ? 'Okna zapadalnosci' : 'Maturity buckets'}
            </p>
            <p className="mt-2 text-lg font-black text-slate-900">{chartData.length}</p>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResultMetricCard
          label={language === 'pl' ? 'Sredni miesiac zapadalnosci' : 'Average maturity month'}
          value={formatCurrency(averageMaturityValue)}
          description={
            language === 'pl'
              ? 'Srednia kwota netto wracajaca w pojedynczym miesiacu zapadalnosci.'
              : 'Average net cash that returns in each maturity month.'
          }
        />
        <ResultMetricCard
          label={language === 'pl' ? 'Sredni miesiac vs wplata' : 'Average month vs contribution'}
          value={formatCurrency(monthlySpreadGap)}
          description={
            language === 'pl'
              ? 'Dodatni wynik oznacza, ze przecietny miesiac zapadalnosci oddaje wiecej niz typowa partia.'
              : 'Positive values mean average maturity cash is above the typical lot contribution.'
          }
        />
        <ResultMetricCard
          label={language === 'pl' ? 'Zakres drabiny' : 'Ladder coverage'}
          value={`${earliestMonth ? earliestMonth.displayDate : '-'} ${latestMonth ? `- ${latestMonth.displayDate}` : ''}`}
          description={
            language === 'pl'
              ? 'Pierwszy i ostatni miesiac zapadalnosci widoczny w biezacym scenariuszu.'
              : 'First and last maturity month visible in the current scenario.'
          }
        />
      </div>

      <Card className="rounded-2xl border shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-900">
            {language === 'pl' ? 'Harmonogram zapadalnosci' : 'Maturity schedule'}
          </CardTitle>
          <CardDescription>
            {language === 'pl'
              ? 'Uzyj wykresu do oceny rozkladu, a potem potwierdz dokladne sumy w tabeli.'
              : 'Use the chart for spacing, then confirm exact month totals in the table below.'}
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
                    language === 'pl' ? 'Wartosc netto' : 'Net value',
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
                <TableHead className="text-slate-600">{language === 'pl' ? 'Miesiac' : 'Month'}</TableHead>
                <TableHead className="text-right text-slate-600">{language === 'pl' ? 'Zapadajace partie' : 'Lots maturing'}</TableHead>
                <TableHead className="text-right text-slate-600">{language === 'pl' ? 'Gotowka netto' : 'Net cash'}</TableHead>
                <TableHead className="text-right text-slate-600">{language === 'pl' ? 'Udzial osi czasu' : 'Share of timeline'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((item) => (
                <TableRow key={item.date}>
                  <TableCell className="font-medium text-slate-900">{item.displayDate}</TableCell>
                  <TableCell className="text-right text-slate-700">{item.count}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {chartData.length > 0 ? `${((item.count / results.lots.length) * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-slate-50/70 p-4 text-sm leading-6 text-slate-600">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {language === 'pl' ? 'Miesiac szczytowy' : 'Peak maturity month'}
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {peakMonth ? `${peakMonth.displayDate} (${formatCurrency(peakMonth.amount)})` : '-'}
              </p>
              <p className="mt-2">
                {language === 'pl'
                  ? 'Jezeli wiekszosc zapadalnosci zbiera sie w jednym okresie, drabina jest mniej rowna niz sugeruje sam wynik koncowy.'
                  : 'If most maturities cluster in one period, the ladder is less even than it looks from a single top-line return number.'}
              </p>
            </div>

            <div
              className={
                peakShare >= 25
                  ? 'rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950'
                  : 'rounded-2xl border bg-emerald-50/60 p-4 text-sm leading-6 text-emerald-950'
              }
            >
              <p
                className={
                  peakShare >= 25
                    ? 'text-[11px] font-bold uppercase tracking-wide text-amber-800'
                    : 'text-[11px] font-bold uppercase tracking-wide text-emerald-800'
                }
              >
                {language === 'pl' ? 'Kontrola koncentracji' : 'Concentration check'}
              </p>
              <p className="mt-2 font-semibold">
                {peakMonth
                  ? `${peakShare.toFixed(1)}% ${language === 'pl' ? 'partii zapada w' : 'of lots mature in'} ${peakMonth.displayDate}.`
                  : language === 'pl'
                    ? 'Brak danych koncentracji.'
                    : 'No maturity concentration available.'}
              </p>
              <p className="mt-2">
                {peakShare >= 25
                  ? language === 'pl'
                    ? 'Ta drabina jest wyraznie skupiona. Plynnosc wraca w mniejszej liczbie okien niz sugerowalaby gladka drabina.'
                    : 'This ladder is meaningfully clustered. Liquidity arrives in fewer windows than a smooth ladder would suggest.'
                  : language === 'pl'
                    ? 'Zapadalnosci sa rozsadnie rozlozone w obecnej osi czasu.'
                    : 'Maturities are reasonably spread across the current timeline.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 text-sm leading-6 text-slate-600">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {language === 'pl' ? 'Kolejnosc czytania' : 'Reading order'}
            </p>
            <p className="mt-2">
              {language === 'pl'
                ? '1. Sprawdz zakres. 2. Sprawdz miesiac szczytowy. 3. Sprawdz koncentracje. 4. Potwierdz sumy miesieczne w tabeli.'
                : '1. Check coverage. 2. Check peak month. 3. Check concentration. 4. Confirm exact month totals in the table.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
