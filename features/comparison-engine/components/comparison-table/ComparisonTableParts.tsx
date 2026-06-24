'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  TableRowLimit,
  tableRowLimitOptions,
} from '@/shared/components/results/TableDensityControls';
import { ComparisonScenarioSnapshot } from '@/features/comparison-engine/lib/comparison-table-model';

export function ComparisonTableStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 md:border-r md:border-border last:md:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ComparisonTablePaginationControls({
  page,
  totalPages,
  rowLimit,
  totalRows,
  visibleRangeLabel,
  onPageChange,
  onRowLimitChange,
  labels,
}: {
  page: number;
  totalPages: number;
  rowLimit: TableRowLimit;
  totalRows: number;
  visibleRangeLabel: string;
  onPageChange: (page: number) => void;
  onRowLimitChange: (limit: TableRowLimit) => void;
  labels: {
    rowsShown: string;
    rowsPerPage: string;
    all: string;
    previous: string;
    next: string;
    page: string;
  };
}) {
  const smallestLimit =
    tableRowLimitOptions.find(
      (option): option is Exclude<TableRowLimit, 'all'> => option !== 'all',
    ) ?? 12;
  const needsDensityControls = totalRows > smallestLimit;
  const needsPageControls = rowLimit !== 'all' && totalPages > 1;

  return (
    <div className="flex flex-col gap-3 md:items-end">
      <p className="text-xs font-semibold text-muted-foreground">
        {labels.rowsShown}: {visibleRangeLabel}
      </p>
      {needsDensityControls ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{labels.rowsPerPage}</span>
          {tableRowLimitOptions.map((option) => (
            <Button
              key={String(option)}
              type="button"
              variant={rowLimit === option ? 'default' : 'outline'}
              size="sm"
              className="h-8 min-w-10 px-3 text-xs font-semibold"
              onClick={() => onRowLimitChange(option)}
            >
              {option === 'all' ? labels.all : option}
            </Button>
          ))}
        </div>
      ) : null}
      {needsPageControls ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-semibold"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            {labels.previous}
          </Button>
          <span className="px-2 text-xs font-semibold text-muted-foreground">
            {labels.page} {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-semibold"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            {labels.next}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function MobileComparisonValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-dashed border-border px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ComparisonScenarioCell({
  snapshot,
  formatCurrency,
  labels,
}: {
  snapshot: ComparisonScenarioSnapshot;
  formatCurrency: (val: number) => string;
  labels: {
    nominal: string;
    real: string;
    profit: string;
  };
}) {
  return (
    <div className="space-y-3 text-xs">
      {snapshot.eventLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {snapshot.eventLabels.map((label) => (
            <Badge key={label} variant="secondary" className="h-5 px-2 text-[10px] font-semibold">
              {label}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ScenarioSnapshotMetric
          label={labels.nominal}
          value={formatCurrency(snapshot.nominalValue)}
          strong
        />
        <ScenarioSnapshotMetric label={labels.real} value={formatCurrency(snapshot.realValue)} />
        <ScenarioSnapshotMetric
          label={labels.profit}
          value={formatCurrency(snapshot.netProfit)}
          tone={snapshot.netProfit >= 0 ? 'positive' : 'negative'}
        />
      </div>
      {snapshot.interestRate !== undefined || snapshot.rateSourceLabel ? (
        <div className="border-t border-dashed border-border pt-2 text-[11px] leading-5 text-muted-foreground">
          {snapshot.interestRate !== undefined ? (
            <span className="font-semibold text-foreground">
              {snapshot.interestRate.toFixed(2)}%
            </span>
          ) : null}
          {snapshot.rateSourceLabel ? (
            <span className="ml-2">{snapshot.rateSourceLabel}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function MobileComparisonScenario({
  label,
  snapshot,
  formatCurrency,
  labels,
}: {
  label: string;
  snapshot: ComparisonScenarioSnapshot;
  formatCurrency: (val: number) => string;
  labels: {
    nominal: string;
    real: string;
    profit: string;
  };
}) {
  return (
    <div className="border-t border-dashed border-border px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      {snapshot.eventLabels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {snapshot.eventLabels.map((eventLabel) => (
            <Badge
              key={eventLabel}
              variant="secondary"
              className="h-5 px-2 text-[10px] font-semibold"
            >
              {eventLabel}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="mt-2 grid grid-cols-1 gap-2">
        <ScenarioSnapshotMetric
          label={labels.nominal}
          value={formatCurrency(snapshot.nominalValue)}
          strong
        />
        <ScenarioSnapshotMetric label={labels.real} value={formatCurrency(snapshot.realValue)} />
        <ScenarioSnapshotMetric
          label={labels.profit}
          value={formatCurrency(snapshot.netProfit)}
          tone={snapshot.netProfit >= 0 ? 'positive' : 'negative'}
        />
      </div>
      {snapshot.interestRate !== undefined || snapshot.rateSourceLabel ? (
        <p className="mt-2 border-t border-dashed border-border pt-2 text-[11px] leading-5 text-muted-foreground">
          {snapshot.interestRate !== undefined ? (
            <span className="font-semibold text-foreground">
              {snapshot.interestRate.toFixed(2)}%
            </span>
          ) : null}
          {snapshot.rateSourceLabel ? (
            <span className="ml-2">{snapshot.rateSourceLabel}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function ScenarioSnapshotMetric({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-mono text-xs',
          strong ? 'font-semibold text-foreground' : 'text-muted-foreground',
          tone === 'positive' ? 'financial-positive' : '',
          tone === 'negative' ? 'text-destructive' : '',
        )}
      >
        {value}
      </p>
    </div>
  );
}
