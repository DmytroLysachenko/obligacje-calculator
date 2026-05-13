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

interface ComparisonTableProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  bondTypeA: string;
  bondTypeB: string;
  formatCurrency: (val: number) => string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  resultsA,
  resultsB,
  bondTypeA,
  bondTypeB,
  formatCurrency,
}) => {
  const { t, language } = useLanguage();
  const higherColumnLabel =
    language === 'pl' ? 'Aktualnie wyzej w tym wierszu' : 'Ahead in this row';
  const higherBadgeSuffix = language === 'pl' ? 'wyzej' : 'ahead';
  const tieLabel = language === 'pl' ? 'Remis' : 'Tie';

  const maxLen = Math.max(resultsA.timeline.length, resultsB.timeline.length);
  const summaryRows = [
    {
      label: language === 'pl' ? 'Wyplata netto' : 'Net payout',
      a: resultsA.netPayoutValue,
      b: resultsB.netPayoutValue,
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
          <div className="rounded-2xl border border-slate-200 bg-white">
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="sticky left-0 z-10 h-12 w-24 bg-white px-6 text-sm font-semibold text-slate-600">
                      {t('common.year')}
                    </TableHead>
                    <TableHead className="h-12 px-4 text-sm font-semibold text-slate-700">
                      {bondTypeA} (A)
                    </TableHead>
                    <TableHead className="h-12 px-4 text-sm font-semibold text-slate-700">
                      {bondTypeB} (B)
                    </TableHead>
                    <TableHead className="h-12 px-6 text-right text-sm font-semibold text-slate-600">
                      {higherColumnLabel}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: maxLen }).map((_, i) => {
                    const valA = resultsA.timeline[i]?.nominalValueAfterInterest;
                    const valB = resultsB.timeline[i]?.nominalValueAfterInterest;
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
                        <TableCell className="sticky left-0 z-10 bg-inherit px-6 py-4 font-bold text-slate-900">
                          {language === 'pl' ? `Rok ${i + 1}` : `Year ${i + 1}`}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4 font-mono text-sm',
                            higherScenario === 'A'
                              ? 'font-bold text-slate-900'
                              : 'text-slate-600',
                          )}
                        >
                          {valA ? formatCurrency(valA) : '---'}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4 font-mono text-sm',
                            higherScenario === 'B'
                              ? 'font-bold text-slate-900'
                              : 'text-slate-600',
                          )}
                        >
                          {valB ? formatCurrency(valB) : '---'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
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
