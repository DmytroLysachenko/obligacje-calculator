'use client';

import React from 'react';
import { Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { CalculationResult } from '@/features/bond-core/types';
import { ResponsiveTableSheet } from '@/shared/components/ResponsiveTableSheet';

interface ComparisonTableProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  bondTypeA: string;
  bondTypeB: string;
  showRealValue: boolean;
  formatCurrency: (val: number) => string;
}

function ComparisonTableStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  resultsA,
  resultsB,
  bondTypeA,
  bondTypeB,
  showRealValue,
  formatCurrency,
}) => {
  const { t, language } = useLanguage();
  const higherColumnLabel =
    language === 'pl' ? 'Aktualnie wyzej w tym wierszu' : 'Ahead in this row';
  const higherBadgeSuffix = language === 'pl' ? 'wyzej' : 'ahead';
  const tieLabel = language === 'pl' ? 'Remis' : 'Tie';
  const resultAValue = showRealValue ? resultsA.finalRealValue : resultsA.netPayoutValue;
  const resultBValue = showRealValue ? resultsB.finalRealValue : resultsB.netPayoutValue;
  const firstLead =
    resultAValue === resultBValue
      ? tieLabel
      : resultAValue > resultBValue
        ? bondTypeA
        : bondTypeB;

  const maxLen = Math.max(resultsA.timeline.length, resultsB.timeline.length);
  const summaryRows = [
    {
      label: showRealValue
        ? t('bonds.real_value_inflation')
        : language === 'pl' ? 'Wyplata netto' : 'Net payout',
      a: resultAValue,
      b: resultBValue,
    },
    {
      label: language === 'pl' ? 'Zysk netto' : 'Net profit',
      a: resultsA.totalProfit,
      b: resultsB.totalProfit,
    },
    {
      label: language === 'pl' ? 'Podatek' : 'Tax paid',
      a: resultsA.totalTax,
      b: resultsB.totalTax,
    },
  ];

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-none">
      <CardHeader className="border-b bg-muted/20 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
          <Scale className="h-5 w-5 text-primary" />
          {t('comparison.table_title')}
        </CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          {language === 'pl'
            ? 'Proste sprawdzenie wartosci rok po roku. Uzywaj tej tabeli do odczytu, kiedy jedna sciezka prowadzi w danym punkcie, a nie jako sygnalu rekomendacyjnego.'
            : 'Plain year-by-year value check. Use it to inspect where one path is ahead at a given point, not as a recommendation signal.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        <div className="grid grid-cols-1 gap-3 border-b bg-slate-50/50 px-6 py-5 md:grid-cols-3">
          <ComparisonTableStat
            label={language === 'pl' ? 'Wiersze osi czasu' : 'Timeline rows'}
            value={String(maxLen)}
          />
          <ComparisonTableStat
            label={language === 'pl' ? 'Lepsza wyplata netto' : 'Higher net payout'}
            value={firstLead}
          />
          <ComparisonTableStat
            label={language === 'pl' ? 'Para porownania' : 'Compared pair'}
            value={`${bondTypeA} / ${bondTypeB}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 border-b bg-slate-50/70 px-6 py-5 md:grid-cols-3">
          {summaryRows.map((row) => {
            const higherScenario = row.a === row.b ? null : row.a > row.b ? 'A' : 'B';

            return (
              <div key={row.label} className="rounded-2xl border bg-white px-4 py-3">
                <p className="text-sm font-semibold text-slate-500">
                  {row.label}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-slate-900">
                      {bondTypeA}: <span className="font-mono">{formatCurrency(row.a)}</span>
                    </p>
                    <p className="font-semibold text-slate-900">
                      {bondTypeB}: <span className="font-mono">{formatCurrency(row.b)}</span>
                    </p>
                  </div>
                  {higherScenario ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        'border px-3 py-1 text-xs font-semibold',
                        higherScenario === 'A'
                          ? 'border-blue-200 bg-blue-50 text-blue-800'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                      )}
                    >
                      {higherScenario === 'A' ? bondTypeA : bondTypeB}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      {tieLabel}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6">
          <ResponsiveTableSheet
            title={language === 'pl' ? 'Porownanie wiersz po wierszu' : 'Row-by-row comparison'}
            description={
              language === 'pl'
                ? 'Na mniejszych ekranach porownuj scenariusze jako liste punktow zamiast szerokiej tabeli.'
                : 'On smaller screens, compare the scenarios as a list of checkpoints instead of a wide table.'
            }
            triggerLabel={language === 'pl' ? 'Otworz tabele porownania' : 'Open comparison table'}
            triggerCount={`${maxLen} ${language === 'pl' ? 'wierszy osi czasu' : 'timeline rows'}`}
          >
            {Array.from({ length: maxLen }).map((_, i) => {
              const pointA = resultsA.timeline[i];
              const pointB = resultsB.timeline[i];
              const valA = showRealValue ? pointA?.realValue : pointA?.totalValue;
              const valB = showRealValue ? pointB?.realValue : pointB?.totalValue;

              return (
                <div key={`mobile-compare-${i}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {pointA?.periodLabel
                          ?? pointB?.periodLabel
                          ?? (language === 'pl' ? `Wiersz ${i + 1}` : `Row ${i + 1}`)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(pointA?.cycleEndDate ?? pointB?.cycleEndDate ?? '').slice(0, 10)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileComparisonValue label={bondTypeA} value={valA ? formatCurrency(valA) : '---'} />
                    <MobileComparisonValue label={bondTypeB} value={valB ? formatCurrency(valB) : '---'} />
                  </div>
                </div>
              );
            })}
          </ResponsiveTableSheet>

          <div className="hidden rounded-2xl border border-slate-200 bg-white lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              <p>
                {language === 'pl'
                  ? 'Tabela potwierdza, gdzie dany scenariusz prowadzi w konkretnym okresie.'
                  : 'The table confirms which scenario is ahead in a specific period.'}
              </p>
              <p className="text-sm font-semibold text-slate-500">
                {maxLen} {language === 'pl' ? 'wierszy osi czasu' : 'timeline rows'}
              </p>
            </div>

            <div>
              <Table className="table-fixed w-full">
                <TableHeader className="bg-white">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="sticky left-0 top-0 z-10 h-12 w-[22%] bg-white px-4 text-xs font-semibold text-slate-600">
                      {t('common.year')}
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[26%] bg-white px-4 text-xs font-semibold text-slate-700">
                      {bondTypeA} (A)
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[26%] bg-white px-4 text-xs font-semibold text-slate-700">
                      {bondTypeB} (B)
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[26%] bg-white px-4 text-right text-xs font-semibold text-slate-600">
                      {higherColumnLabel}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: maxLen }).map((_, i) => {
                    const pointA = resultsA.timeline[i];
                    const pointB = resultsB.timeline[i];
                    const valA = showRealValue ? pointA?.realValue : pointA?.totalValue;
                    const valB = showRealValue ? pointB?.realValue : pointB?.totalValue;
                    const higherScenario =
                      valA !== undefined && valB !== undefined
                        ? valA === valB
                          ? null
                          : valA > valB
                            ? 'A'
                            : 'B'
                        : valA !== undefined
                          ? 'A'
                          : valB !== undefined
                            ? 'B'
                            : null;

                    return (
                      <TableRow key={i} className="transition-colors odd:bg-slate-50/30 hover:bg-slate-50/80">
                        <TableCell className="sticky left-0 z-10 bg-inherit px-4 py-4 font-bold text-slate-900">
                          <div className="space-y-1">
                            <p>
                              {pointA?.periodLabel
                                ?? pointB?.periodLabel
                                ?? (language === 'pl' ? `Wiersz ${i + 1}` : `Row ${i + 1}`)}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500">
                              {(pointA?.cycleEndDate ?? pointB?.cycleEndDate ?? '').slice(0, 10)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4 font-mono text-xs',
                            higherScenario === 'A'
                              ? 'font-bold text-slate-900'
                              : 'text-slate-600',
                          )}
                        >
                          {valA ? formatCurrency(valA) : '---'}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4 font-mono text-xs',
                            higherScenario === 'B'
                              ? 'font-bold text-slate-900'
                              : 'text-slate-600',
                          )}
                        >
                          {valB ? formatCurrency(valB) : '---'}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          {higherScenario ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                'border px-3 py-0.5 text-xs font-semibold',
                                higherScenario === 'A'
                                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                              )}
                            >
                              {higherScenario === 'A' ? bondTypeA : bondTypeB} {higherBadgeSuffix}
                            </Badge>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">{tieLabel}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="border-t bg-slate-50/70 px-6 py-4 text-sm leading-6 text-slate-600">
          {language === 'pl'
            ? 'Znacznik pokazuje tylko, ktora sciezka prowadzi w konkretnym wierszu. Pozniejsze okresy moga odwrocic wczesniejsze prowadzenie.'
            : 'The badge shows which path is ahead in that specific row only. Later rows can reverse earlier leads.'}
        </div>
      </CardContent>
    </Card>
  );
};

function MobileComparisonValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
