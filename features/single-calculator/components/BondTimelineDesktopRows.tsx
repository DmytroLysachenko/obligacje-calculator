'use client';

import { RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BondTimelineRowsProps } from '@/features/single-calculator/types/timeline';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { TableDensityControls } from '@/shared/components/results/TableDensityControls';

type BondTimelineDesktopRowsProps = BondTimelineRowsProps & {
  firstCashFlowLabel: string;
};

export function BondTimelineDesktopRows({
  displayedTimeline,
  filteredTimelineLength,
  activeFilterCount,
  rowLimit,
  onRowLimitChange,
  onResetFilters,
  formatCurrency,
  firstCashFlowLabel,
}: BondTimelineDesktopRowsProps) {
  const { t } = useAppI18n();
  const densityLabels = {
    rowsShown: t('common.rows_shown'),
    rowsPerPage: t('common.rows_per_page'),
    all: t('common.all'),
  };

  return (
    <div className="ui-table-frame hidden w-full lg:block">
      <p id="bond-timeline-table-caption" className="sr-only">
        {t('bonds.timeline')}
      </p>
      <Table
        className="w-full table-fixed text-sm tabular-nums"
        aria-describedby="bond-timeline-table-caption"
      >
        <TableHeader>
          <TableRow className="h-12 hover:bg-transparent">
            <TableHead scope="col" className="sticky top-0 z-10 h-12 w-[11%] bg-background">
              {t('common.period')}
            </TableHead>
            <TableHead scope="col" className="sticky top-0 z-10 h-12 w-[22%] bg-background">
              {t('bonds.schedule.checkpoint_meaning')}
            </TableHead>
            <TableHead scope="col" className="sticky top-0 z-10 h-12 w-[15%] bg-background">
              {t('bonds.schedule.rate_and_basis')}
            </TableHead>
            <TableHead
              scope="col"
              className="sticky top-0 z-10 h-12 w-[11%] bg-background text-right"
            >
              {t('bonds.total_wealth')}
            </TableHead>
            <TableHead
              scope="col"
              className="sticky top-0 z-10 h-12 w-[11%] bg-background text-right"
            >
              {firstCashFlowLabel}
            </TableHead>
            <TableHead
              scope="col"
              className="sticky top-0 z-10 h-12 w-[10%] bg-background text-right"
            >
              {t('common.net_profit')}
            </TableHead>
            <TableHead
              scope="col"
              className="sticky top-0 z-10 h-12 w-[10%] bg-background text-right"
            >
              {t('bonds.real_value')}
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-12 w-[12%] bg-background text-right">
              {t('bonds.early_exit_payout')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedTimeline.map((row) => (
            <TableRow
              key={row.key}
              className={cn(
                'h-14 border-b border-border transition-colors hover:bg-muted/25',
                row.isWithdrawal ? 'bg-muted/45 font-semibold' : '',
              )}
            >
              <TableCell className="py-4 align-top">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{row.periodLabel}</span>
                    {row.projectionLabel ? (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          row.projectionLabel === 'Prognoza' || row.projectionLabel === 'Projected'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {row.projectionLabel}
                      </span>
                    ) : null}
                  </div>
                  {row.eventLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {row.eventLabels.map((label, index) => (
                        <Badge
                          key={`${row.key}-${index}`}
                          variant="secondary"
                          className="h-5 px-2 text-[11px] font-semibold"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="min-w-0 py-4 align-top text-xs text-muted-foreground">
                <div className="max-w-[28ch] space-y-1 pr-3">
                  <p className="whitespace-normal break-words font-medium leading-5 text-foreground">
                    {row.cadenceLabel}
                  </p>
                  <p className="whitespace-normal break-words text-xs leading-5 text-muted-foreground">
                    {row.valueMeaningLabel}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-4 align-top">
                <div className="flex flex-col gap-1 pr-2">
                  <span className="financial-number font-mono text-xs font-semibold text-foreground">
                    {row.interestRateLabel}
                  </span>
                  <span className="line-clamp-2 text-xs leading-5">{row.rateSourceLabel}</span>
                  {row.referenceLabel ? (
                    <span className="line-clamp-2 text-[10px] italic leading-4 text-muted-foreground">
                      {row.referenceLabel}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="financial-number py-4 text-right align-top font-mono text-xs">
                {formatCurrency(row.totalWealth)}
              </TableCell>
              <TableCell className="financial-number py-4 text-right align-top font-mono text-xs text-muted-foreground">
                {formatCurrency(row.paidOutCash)}
              </TableCell>
              <TableCell
                className={cn(
                  'financial-number py-4 text-right align-top font-mono text-xs',
                  row.netProfit >= 0 ? 'financial-positive' : 'text-destructive',
                )}
              >
                {formatCurrency(row.netProfit)}
              </TableCell>
              <TableCell className="financial-number py-4 text-right align-top font-mono text-xs text-muted-foreground">
                {formatCurrency(row.realValue)}
              </TableCell>
              <TableCell className="financial-number py-4 align-top text-right font-mono text-xs font-semibold">
                {formatCurrency(row.earlyExitValue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TableDensityControls
        value={rowLimit}
        totalRows={filteredTimelineLength}
        visibleRows={displayedTimeline.length}
        onChange={onRowLimitChange}
        className="border-t border-border px-1"
        labels={densityLabels}
      />

      {filteredTimelineLength === 0 ? (
        <div className="space-y-3 p-12 text-center text-muted-foreground">
          <p>{t('common.no_results_found') || 'No results found for current filters.'}</p>
          {activeFilterCount > 0 ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onResetFilters}
              >
                <RotateCcw className="h-4 w-4" />
                {t('common.reset_filters')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
