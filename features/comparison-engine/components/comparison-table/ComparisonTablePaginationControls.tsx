'use client';

import { Button } from '@/components/ui/button';
import {
  TableRowLimit,
  tableRowLimitOptions,
} from '@/shared/components/results/TableDensityControls';

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
    <footer className="flex flex-col gap-4 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
        {labels.rowsShown}: {visibleRangeLabel}
      </p>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {needsDensityControls ? (
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={labels.rowsPerPage}
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {labels.rowsPerPage}
            </span>
            {tableRowLimitOptions.map((option) => (
              <Button
                key={String(option)}
                type="button"
                variant={rowLimit === option ? 'default' : 'outline'}
                size="sm"
                className="h-11 min-w-11 px-3 text-xs font-semibold"
                onClick={() => onRowLimitChange(option)}
              >
                {option === 'all' ? labels.all : option}
              </Button>
            ))}
          </div>
        ) : null}
        {needsPageControls ? (
          <nav className="flex items-center gap-2" aria-label={`${labels.page} navigation`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 px-3 text-xs font-semibold"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              {labels.previous}
            </Button>
            <span className="min-w-14 px-1 text-center text-xs font-semibold text-muted-foreground">
              {labels.page} {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 px-3 text-xs font-semibold"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
              {labels.next}
            </Button>
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
