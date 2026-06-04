'use client';

import React from 'react';
import { Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CalculationResult } from '@/features/bond-core/types';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';

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
    <div className="px-4 py-3 md:border-r md:border-border last:md:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
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
    const { t } = useAppI18n();
  const higherColumnLabel = t('comparison.table_ahead_in_row');
  const higherBadgeSuffix = t('comparison.table_ahead_badge_suffix');
  const tieLabel = t('comparison.table_tie');
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
        : t('bonds.net_payout'),
      a: resultAValue,
      b: resultBValue,
    },
    {
      label: t('common.net_profit'),
      a: resultsA.totalProfit,
      b: resultsB.totalProfit,
    },
    {
      label: t('comparison.table_tax_paid'),
      a: resultsA.totalTax,
      b: resultsB.totalTax,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="ui-section-title flex items-center gap-2">
          <Scale className="h-5 w-5 text-foreground" />
          {t('comparison.table_title')}
        </h2>
        <p className="ui-body max-w-3xl text-muted-foreground">
          {t('comparison.table_desc')}
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-0 border-b border-dashed px-2 py-3 md:grid-cols-3 md:px-6">
          <ComparisonTableStat
            label={t('comparison.table_timeline_rows')}
            value={String(maxLen)}
          />
          <ComparisonTableStat
            label={t('comparison.table_higher_payout')}
            value={firstLead}
          />
          <ComparisonTableStat
            label={t('comparison.table_compared_pair')}
            value={`${bondTypeA} / ${bondTypeB}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-dashed px-6 py-5 md:grid-cols-3">
          {summaryRows.map((row) => {
            const higherScenario = row.a === row.b ? null : row.a > row.b ? 'A' : 'B';

            return (
              <div key={row.label} className="bg-muted/30 px-4 py-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  {row.label}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">
                      {bondTypeA}: <span className="font-mono">{formatCurrency(row.a)}</span>
                    </p>
                    <p className="font-semibold text-foreground">
                      {bondTypeB}: <span className="font-mono">{formatCurrency(row.b)}</span>
                    </p>
                  </div>
                  {higherScenario ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        'border px-3 py-1 text-xs font-semibold',
                        higherScenario === 'A'
                          ? 'border-border bg-card text-foreground'
                          : 'border-success/30 bg-success/10 text-success',
                      )}
                    >
                      {higherScenario === 'A' ? bondTypeA : bondTypeB}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-border bg-muted text-xs font-semibold text-muted-foreground"
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
            title={t('comparison.table_mobile_title')}
            description={t('comparison.table_mobile_desc')}
            triggerLabel={t('comparison.table_mobile_trigger')}
            triggerCount={t('comparison.table_mobile_count', { count: maxLen })}
          >
            {Array.from({ length: maxLen }).map((_, i) => {
              const pointA = resultsA.timeline[i];
              const pointB = resultsB.timeline[i];
              const valA = showRealValue ? pointA?.realValue : pointA?.totalValue;
              const valB = showRealValue ? pointB?.realValue : pointB?.totalValue;

              return (
                <div key={`mobile-compare-${i}`} className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {pointA?.periodLabel
                          ?? pointB?.periodLabel
                          ?? t('comparison.table_row_fallback', { row: i + 1 })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
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

          <div className="hidden rounded-lg bg-card lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              <p>
                {t('comparison.table_desktop_note')}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {t('comparison.table_mobile_count', { count: maxLen })}
              </p>
            </div>

            <div>
              <Table className="w-full table-fixed tabular-nums">
                <TableHeader className="bg-white">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="sticky left-0 top-0 z-10 h-12 w-[22%] bg-card px-4 text-xs font-semibold text-muted-foreground">
                      {t('common.year')}
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[26%] bg-card px-4 text-xs font-semibold text-foreground">
                      {bondTypeA} (A)
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[26%] bg-card px-4 text-xs font-semibold text-foreground">
                      {bondTypeB} (B)
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[26%] bg-card px-4 text-right text-xs font-semibold text-muted-foreground">
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
                      <TableRow key={i} className="border-b border-border transition-colors odd:bg-muted/20 hover:bg-muted/35">
                        <TableCell className="sticky left-0 z-10 bg-inherit px-4 py-5 font-semibold text-foreground">
                          <div className="space-y-1">
                            <p>
                              {pointA?.periodLabel
                                ?? pointB?.periodLabel
                                ?? t('comparison.table_row_fallback', { row: i + 1 })}
                            </p>
                            <p className="text-[11px] font-medium text-muted-foreground">
                              {(pointA?.cycleEndDate ?? pointB?.cycleEndDate ?? '').slice(0, 10)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4 font-mono text-xs',
                            higherScenario === 'A'
                              ? 'font-semibold text-foreground'
                              : 'text-muted-foreground',
                          )}
                        >
                          {valA ? formatCurrency(valA) : '---'}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4 font-mono text-xs',
                            higherScenario === 'B'
                              ? 'font-semibold text-foreground'
                              : 'text-muted-foreground',
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
                                  ? 'border-border bg-card text-foreground'
                                  : 'border-success/30 bg-success/10 text-success',
                              )}
                            >
                              {higherScenario === 'A' ? bondTypeA : bondTypeB} {higherBadgeSuffix}
                            </Badge>
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">{tieLabel}</span>
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

        <div className="border-t border-dashed border-border px-6 py-4 text-sm leading-6 text-muted-foreground">
          {t('comparison.table_footer_note')}
        </div>
      </div>
    </section>
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
    <div className="border-t border-dashed border-border px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}




