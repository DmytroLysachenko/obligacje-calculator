'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TableRowLimit = 12 | 24 | 50 | 'all';

export const tableRowLimitOptions: TableRowLimit[] = [12, 24, 50, 'all'];

export function applyTableRowLimit<T>(rows: T[], limit: TableRowLimit): T[] {
  if (limit === 'all') {
    return rows;
  }

  return rows.slice(0, limit);
}

export function getVisibleRowLabel({
  visible,
  total,
  allLabel,
}: {
  visible: number;
  total: number;
  allLabel: string;
}) {
  if (total === 0) {
    return '0';
  }

  if (visible >= total) {
    return `${total}`;
  }

  return `${visible} / ${total} ${allLabel}`;
}

interface TableDensityControlsProps {
  value: TableRowLimit;
  totalRows: number;
  visibleRows: number;
  onChange: (value: TableRowLimit) => void;
  labels: {
    rowsShown: string;
    rowsPerPage: string;
    all: string;
    jumpToRows?: string;
  };
  className?: string;
  emptyMessage?: string;
}

export function TableDensityControls({
  value,
  totalRows,
  visibleRows,
  onChange,
  labels,
  className,
  emptyMessage,
}: TableDensityControlsProps) {
  const smallestLimit =
    tableRowLimitOptions.find(
      (option): option is Exclude<TableRowLimit, 'all'> => option !== 'all',
    ) ?? 12;
  const needsDensityControls = totalRows > smallestLimit;

  if (totalRows === 0) {
    return (
      <div className={cn('border-t border-border py-4', className)} role="status">
        <p className="text-sm leading-6 text-muted-foreground">
          {emptyMessage ?? labels.rowsShown}: 0
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-border py-3 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <p className="text-xs font-semibold text-muted-foreground">
        {labels.rowsShown}:{' '}
        {getVisibleRowLabel({
          visible: visibleRows,
          total: totalRows,
          allLabel: labels.all,
        })}
      </p>
      {needsDensityControls ? (
        <div className="flex flex-wrap items-center gap-2" aria-label={labels.jumpToRows}>
          <span className="text-xs font-semibold text-muted-foreground">{labels.rowsPerPage}</span>
          {tableRowLimitOptions.map((option) => (
            <Button
              key={String(option)}
              type="button"
              variant={value === option ? 'default' : 'outline'}
              size="sm"
              className="h-11 min-w-11 px-3 text-xs font-semibold"
              onClick={() => onChange(option)}
            >
              {option === 'all' ? labels.all : option}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
