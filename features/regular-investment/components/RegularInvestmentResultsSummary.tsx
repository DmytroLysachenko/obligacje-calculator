'use client';

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RegularInvestmentResult } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { Calendar, FileSpreadsheet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { convertLotsToCSV, downloadFile } from '@/shared/lib/csv-utils';
import { buildLotsExportHeaders } from '@/shared/lib/export-headers';
import { ResultMetricCard } from '@/shared/components/ResultMetricCard';
import { ResultSummaryHero } from '@/shared/components/ResultSummaryHero';

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

  const primaryStats: SummaryStat[] = [
    {
      label: t('bonds.total_invested'),
      value: formatCurrency(results.totalInvested),
      helper:
        language === 'pl'
          ? 'Suma gotowki wplaconej do planu.'
          : 'Cash paid into the plan.',
    },
    {
      label: t('bonds.final_nominal_value'),
      value: formatCurrency(results.finalNominalValue),
      helper:
        language === 'pl'
          ? 'Wartosc wyjscia przed korekta o inflacje.'
          : 'Projected withdrawal value before inflation adjustment.',
    },
    {
      label: t('bonds.total_net_profit'),
      value: formatCurrency(results.totalProfit),
      helper:
        language === 'pl'
          ? 'Zysk netto po podatku i oplatach.'
          : 'Net gain after tax and early withdrawal fees.',
    },
    {
      label: t('bonds.real_value_inflation'),
      value: formatCurrency(results.finalRealValue),
      helper:
        language === 'pl'
          ? 'Sila nabywcza na dacie koncowej.'
          : 'Inflation-adjusted purchasing power at the end date.',
    },
  ];

  const supportingStats: SummaryStat[] = [
    {
      label: t('bonds.real_cagr'),
      value: `${results.realAnnualizedReturn.toFixed(2)}%`,
      helper:
        language === 'pl'
          ? 'Srednioroczna realna stopa zwrotu.'
          : 'Annualized real return across the full plan.',
    },
    {
      label: t('bonds.tax'),
      value: formatCurrency(results.totalTax),
      helper:
        language === 'pl'
          ? 'Laczny podatek w tym scenariuszu.'
          : 'Total tax assumed in the scenario.',
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
    const headers = buildLotsExportHeaders(t, language);
    const csv = convertLotsToCSV(results.lots, headers, language);
    downloadFile(
      csv,
      `regular_investment_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8',
    );
  };

  return (
    <div className="space-y-6">
      <ResultSummaryHero
        eyebrow={language === 'pl' ? 'Podsumowanie planu' : 'Plan summary'}
        value={formatCurrency(results.finalNominalValue)}
        description={
          language === 'pl'
            ? 'To jest koncowa wartosc dla zatwierdzonego planu regularnych wplat. Najpierw przejrzyj karty podsumowania, a dopiero potem schodz do rocznikow i pojedynczych partii.'
            : 'This is the final projected value for the committed recurring plan. Review the summary cards first, then inspect yearly buckets and recent lots only if you need more detail.'
        }
        narrative={
          language === 'pl'
            ? 'To jest scenariusz dla jednego typu obligacji i jednego rytmu wplat. Traktuj wynik jako test planu, a nie automatyczna rekomendacje.'
            : 'This is a scenario for one bond family and one contribution cadence. Treat it as a plan test, not as an automatic recommendation.'
        }
        actions={[
          {
            label: t('comparison.export'),
            icon: <FileSpreadsheet className="h-4 w-4" />,
            onClick: handleExport,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {primaryStats.map((stat) => (
          <ResultMetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.helper}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {supportingStats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
              <p className="text-2xl font-black tracking-tight text-slate-950">{stat.value}</p>
              <p className="text-sm leading-6 text-slate-600">{stat.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg font-black text-slate-900">
                {language === 'pl' ? 'Budowa rok po roku' : 'Year-by-year build-up'}
              </CardTitle>
              <CardDescription>
                {language === 'pl'
                  ? 'Sprawdz, jak duzy udzial w wyniku koncowym mial kazdy rocznik zakupow.'
                  : 'Review how much capital each purchase year contributed to the final outcome.'}
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
              {language === 'pl' ? 'Roczniki' : 'Buckets'}
            </Badge>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'pl' ? 'Rok' : 'Year'}</TableHead>
                  <TableHead className="text-right">{language === 'pl' ? 'Partie' : 'Lots'}</TableHead>
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
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Calendar className="h-5 w-5" />
              {language === 'pl' ? 'Ostatnie partie' : 'Recent lots'}
            </CardTitle>
            <CardDescription>
              {language === 'pl'
                ? 'Ostatnie zakupy pomagaja skontrolowac czas wejscia, daty zapadalnosci i wartosc netto pojedynczych partii.'
                : 'The latest purchases help verify timing, maturity dates, and per-lot net value.'}
            </CardDescription>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
              {language === 'pl'
                ? 'Najpierw przeczytaj karty podsumowania i roczniki. Pojedyncze partie sa tylko szybka kontrola czasu zakupu i zapadalnosci.'
                : 'Start with the summary cards and yearly buckets. Individual lots are only a quick check of purchase timing and maturity dates.'}
            </div>
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
                        {language === 'pl' ? 'Zapadalnosc' : 'Matures'}{' '}
                        {format(parseISO(lot.maturityDate), 'MMM yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(lot.netValue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'pl' ? 'Wartosc netto partii' : 'Net lot value'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t('regular_summary.invested')}
                      </p>
                      <p className="mt-1 font-medium">{formatCurrency(lot.investedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t('regular_summary.interest')}
                      </p>
                      <p className="mt-1 font-medium text-emerald-700">
                        {formatCurrency(lot.accumulatedInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t('bonds.tax')}
                      </p>
                      <p className="mt-1 font-medium text-amber-700">
                        {formatCurrency(lot.tax)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
