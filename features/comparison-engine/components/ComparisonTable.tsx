'use client';

import { Scale } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalculationResult } from '@/features/bond-core/types';
import {
  ComparisonScenarioCell,
  ComparisonTablePaginationControls,
  ComparisonTableStat,
  MobileComparisonScenario,
  MobileComparisonValue,
} from '@/features/comparison-engine/components/comparison-table/ComparisonTableParts';
import {
  buildComparisonAlignedTableRows,
  ComparisonTableGranularity,
  getComparisonTablePageCount,
  getComparisonTablePageRows,
  getComparisonVisibleRangeLabel,
} from '@/features/comparison-engine/lib/comparison-table-model';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';
import { TableRowLimit } from '@/shared/components/results/TableDensityControls';

interface ComparisonTableProps {
  resultsA: CalculationResult;
  resultsB: CalculationResult;
  purchaseDate: string;
  bondTypeA: string;
  bondTypeB: string;
  formatCurrency: (val: number) => string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  resultsA,
  resultsB,
  purchaseDate,
  bondTypeA,
  bondTypeB,
  formatCurrency,
}) => {
  const { t, locale: language } = useAppI18n();
  const [granularity, setGranularity] = React.useState<ComparisonTableGranularity>('yearly');
  const [rowLimit, setRowLimit] = React.useState<TableRowLimit>(12);
  const [currentPage, setCurrentPage] = React.useState(1);
  const higherColumnLabel = t('comparison.table_ahead_in_row');
  const higherBadgeSuffix = t('comparison.table_ahead_badge_suffix');
  const tieLabel = t('comparison.table_tie');
  const resultAValue = resultsA.netPayoutValue;
  const resultBValue = resultsB.netPayoutValue;
  const firstLead =
    resultAValue === resultBValue ? tieLabel : resultAValue > resultBValue ? bondTypeA : bondTypeB;

  const tableRows = React.useMemo(
    () =>
      buildComparisonAlignedTableRows({
        resultsA,
        resultsB,
        purchaseDate,
        granularity,
        language,
        startLabel: t('comparison.start'),
      }),
    [granularity, language, purchaseDate, resultsA, resultsB, t],
  );

  const totalPages = getComparisonTablePageCount(tableRows.length, rowLimit);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [granularity, rowLimit, resultsA, resultsB]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const displayedRows = React.useMemo(
    () =>
      getComparisonTablePageRows({
        rows: tableRows,
        rowLimit,
        page: currentPage,
      }),
    [currentPage, rowLimit, tableRows],
  );
  const visibleRangeLabel = getComparisonVisibleRangeLabel({
    page: currentPage,
    rowLimit,
    visibleRows: displayedRows.length,
    totalRows: tableRows.length,
  });
  const summaryRows = [
    {
      label: t('bonds.net_payout'),
      a: resultAValue,
      b: resultBValue,
    },
    {
      label: t('bonds.real_value_inflation'),
      a: resultsA.finalRealValue,
      b: resultsB.finalRealValue,
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
        <p className="ui-body max-w-3xl text-muted-foreground">{t('comparison.table_desc')}</p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-0 border-b border-dashed px-2 py-3 md:grid-cols-3 md:px-6">
          <ComparisonTableStat
            label={t('comparison.table_timeline_rows')}
            value={visibleRangeLabel}
          />
          <ComparisonTableStat label={t('comparison.table_higher_payout')} value={firstLead} />
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
                <p className="text-sm font-semibold text-muted-foreground">{row.label}</p>
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

        <div className="flex flex-col gap-3 border-b border-dashed px-6 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(['monthly', 'quarterly', 'yearly'] as ComparisonTableGranularity[]).map((step) => (
              <button
                key={step}
                type="button"
                aria-pressed={granularity === step}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                  granularity === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setGranularity(step)}
              >
                {t(`bonds.chart.periods.${step}`)}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            {t('common.rows_shown')}: {visibleRangeLabel}
          </p>
        </div>

        <div className="px-6">
          <ResponsiveTableSheet
            title={t('comparison.table_mobile_title')}
            description={t('comparison.table_mobile_desc')}
            triggerLabel={t('comparison.table_mobile_trigger')}
            triggerCount={t('comparison.table_mobile_count', { count: tableRows.length })}
          >
            {displayedRows.map((row) => {
              return (
                <div key={`mobile-compare-${row.key}`} className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{row.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{row.dateLabel}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <MobileComparisonScenario
                      label={`${bondTypeA} (A)`}
                      snapshot={row.scenarioA}
                      formatCurrency={formatCurrency}
                      labels={{
                        nominal: t('common.nominal_value'),
                        real: t('common.real_value'),
                        profit: t('common.net_profit'),
                      }}
                    />
                    <MobileComparisonScenario
                      label={`${bondTypeB} (B)`}
                      snapshot={row.scenarioB}
                      formatCurrency={formatCurrency}
                      labels={{
                        nominal: t('common.nominal_value'),
                        real: t('common.real_value'),
                        profit: t('common.net_profit'),
                      }}
                    />
                  </div>
                  <MobileComparisonValue
                    label={higherColumnLabel}
                    value={
                      row.leader === 'tie'
                        ? tieLabel
                        : `${row.leader === 'A' ? bondTypeA : bondTypeB} ${formatCurrency(Math.abs(row.gap))}`
                    }
                  />
                </div>
              );
            })}
          </ResponsiveTableSheet>

          <div className="hidden rounded-lg bg-card lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              <p>{t('comparison.table_desktop_note')}</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {t('comparison.table_mobile_count', { count: tableRows.length })}
              </p>
            </div>

            <div>
              <Table className="w-full table-fixed tabular-nums">
                <TableHeader className="bg-white">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="sticky left-0 top-0 z-10 h-12 w-[22%] bg-card px-4 text-xs font-semibold text-muted-foreground">
                      {t('common.year')}
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[28%] bg-card px-4 text-xs font-semibold text-foreground">
                      {bondTypeA} (A)
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[28%] bg-card px-4 text-xs font-semibold text-foreground">
                      {bondTypeB} (B)
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-12 w-[22%] bg-card px-4 text-right text-xs font-semibold text-muted-foreground">
                      {higherColumnLabel}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRows.map((row) => {
                    const higherScenario = row.leader === 'tie' ? null : row.leader;

                    return (
                      <TableRow
                        key={row.key}
                        className="border-b border-border transition-colors odd:bg-muted/20 hover:bg-muted/35"
                      >
                        <TableCell className="sticky left-0 z-10 bg-inherit px-4 py-5 font-semibold text-foreground">
                          <div className="space-y-1">
                            <p>{row.label}</p>
                            <p className="text-[11px] font-medium text-muted-foreground">
                              {row.dateLabel}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4',
                            higherScenario === 'A' ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          <ComparisonScenarioCell
                            snapshot={row.scenarioA}
                            formatCurrency={formatCurrency}
                            labels={{
                              nominal: t('common.nominal_value'),
                              real: t('common.real_value'),
                              profit: t('common.net_profit'),
                            }}
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-4 py-4',
                            higherScenario === 'B' ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          <ComparisonScenarioCell
                            snapshot={row.scenarioB}
                            formatCurrency={formatCurrency}
                            labels={{
                              nominal: t('common.nominal_value'),
                              real: t('common.real_value'),
                              profit: t('common.net_profit'),
                            }}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          {higherScenario ? (
                            <div className="space-y-2">
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
                              <p className="font-mono text-xs font-semibold text-foreground">
                                {formatCurrency(Math.abs(row.gap))}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {tieLabel}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <ComparisonTablePaginationControls
            page={currentPage}
            totalPages={totalPages}
            rowLimit={rowLimit}
            totalRows={tableRows.length}
            visibleRangeLabel={visibleRangeLabel}
            onPageChange={setCurrentPage}
            onRowLimitChange={setRowLimit}
            labels={{
              rowsShown: t('common.rows_shown'),
              rowsPerPage: t('common.rows_per_page'),
              all: t('common.all'),
              previous: t('common.previous'),
              next: t('common.next'),
              page: t('common.page'),
            }}
          />
        </div>

        <div className="border-t border-dashed border-border px-6 py-4 text-sm leading-6 text-muted-foreground">
          {t('comparison.table_footer_note')}
        </div>
      </div>
    </section>
  );
};
