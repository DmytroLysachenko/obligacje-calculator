'use client';

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { Calendar, FileSpreadsheet, TrendingUp, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { convertLotsToCSV, downloadFile } from '@/shared/lib/csv-utils';

interface RegularInvestmentResultsSummaryProps {
  results: RegularInvestmentResult;
}

type SummaryStat = {
  label: string;
  value: string;
  helper: string;
};

type YearBucket = {
  year: string;
  lots: number;
  invested: number;
  interest: number;
  tax: number;
  netValue: number;
};

const MAX_RECENT_LOTS = 12;

export const RegularInvestmentResultsSummary: React.FC<RegularInvestmentResultsSummaryProps> = ({
  results,
}) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pl' ? pl : enGB;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(value);

  const stats: SummaryStat[] = [
    {
      label: t('bonds.total_invested'),
      value: formatCurrency(results.totalInvested),
      helper: 'Cash paid into the plan.',
    },
    {
      label: t('bonds.final_nominal_value'),
      value: formatCurrency(results.finalNominalValue),
      helper: 'Projected withdrawal value before inflation adjustment.',
    },
    {
      label: t('bonds.total_net_profit'),
      value: formatCurrency(results.totalProfit),
      helper: 'Net gain after tax and early withdrawal fees.',
    },
    {
      label: t('bonds.real_value_inflation'),
      value: formatCurrency(results.finalRealValue),
      helper: 'Inflation-adjusted purchasing power at the end date.',
    },
    {
      label: t('bonds.real_cagr'),
      value: `${results.realAnnualizedReturn.toFixed(2)}%`,
      helper: 'Annualized real return across the full plan.',
    },
    {
      label: t('bonds.tax'),
      value: formatCurrency(results.totalTax),
      helper: 'Total tax assumed in the scenario.',
    },
  ];

  const yearlyBuckets = useMemo<YearBucket[]>(() => {
    const grouped = new Map<string, YearBucket>();

    results.lots.forEach((lot) => {
      const year = format(parseISO(lot.purchaseDate), 'yyyy');
      const current = grouped.get(year) ?? {
        year,
        lots: 0,
        invested: 0,
        interest: 0,
        tax: 0,
        netValue: 0,
      };

      current.lots += 1;
      current.invested += lot.investedAmount;
      current.interest += lot.accumulatedInterest;
      current.tax += lot.tax;
      current.netValue += lot.netValue;

      grouped.set(year, current);
    });

    return Array.from(grouped.values()).sort((left, right) => left.year.localeCompare(right.year));
  }, [results.lots]);

  const recentLots = useMemo(
    () =>
      [...results.lots]
        .sort(
          (left, right) =>
            parseISO(right.purchaseDate).getTime() - parseISO(left.purchaseDate).getTime(),
        )
        .slice(0, MAX_RECENT_LOTS),
    [results.lots],
  );

  const handleExport = () => {
    const headers = {
      purchaseDate: t('bonds.purchase_date'),
      maturityDate: t('bonds.maturity_date'),
      invested: t('regular_summary.invested'),
      interest: t('regular_summary.interest'),
      tax: t('bonds.tax'),
      fee: t('bonds.early_withdrawal_fee'),
      netValue: t('regular_summary.net_value'),
    };

    const csv = convertLotsToCSV(results.lots, headers);
    downloadFile(csv, `regular_investment_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-700"
              >
                Scenario summary
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900">
              {formatCurrency(results.finalNominalValue)}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">
              Final projected value for the committed contribution plan. Review the summary cards first,
              then inspect yearly buckets and recent lots only if you need more detail.
            </CardDescription>
          </div>

          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4" />
            {t('comparison.export')}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-sm leading-6 text-muted-foreground">{stat.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Year-by-year build-up
              </CardTitle>
              <CardDescription>
                Review how much capital each purchase year contributed to the final outcome.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Lots</TableHead>
                  <TableHead className="text-right">{t('regular_summary.invested')}</TableHead>
                  <TableHead className="text-right">{t('regular_summary.interest')}</TableHead>
                  <TableHead className="text-right">{t('bonds.tax')}</TableHead>
                  <TableHead className="text-right">{t('regular_summary.net_value')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyBuckets.map((bucket) => (
                  <TableRow key={bucket.year}>
                    <TableCell className="font-medium">{bucket.year}</TableCell>
                    <TableCell className="text-right">{bucket.lots}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bucket.invested)}</TableCell>
                    <TableCell className="text-right text-emerald-700">
                      {formatCurrency(bucket.interest)}
                    </TableCell>
                    <TableCell className="text-right text-amber-700">
                      {formatCurrency(bucket.tax)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(bucket.netValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Recent lots
            </CardTitle>
            <CardDescription>
              The latest purchases help verify timing, maturity dates, and per-lot net value.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {recentLots.map((lot) => (
                <div
                  key={`${lot.purchaseDate}-${lot.maturityDate}-${lot.investedAmount}`}
                  className="rounded-2xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {format(parseISO(lot.purchaseDate), 'MMMM yyyy', { locale: dateLocale })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Matures {format(parseISO(lot.maturityDate), 'MMM yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(lot.netValue)}
                      </p>
                      <p className="text-xs text-muted-foreground">Net lot value</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('regular_summary.invested')}
                      </p>
                      <p className="mt-1 font-medium">{formatCurrency(lot.investedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('regular_summary.interest')}
                      </p>
                      <p className="mt-1 font-medium text-emerald-700">
                        {formatCurrency(lot.accumulatedInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('bonds.tax')}
                      </p>
                      <p className="mt-1 font-medium text-amber-700">{formatCurrency(lot.tax)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('bonds.early_withdrawal_fee')}
                      </p>
                      <p className="mt-1 font-medium">
                        {formatCurrency(lot.earlyWithdrawalFee)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-5 w-5 text-primary" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">How to read this page</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    This calculator assumes a repeating contribution schedule. Treat the output as a
                    scenario test for one bond type, not a recommendation engine.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
