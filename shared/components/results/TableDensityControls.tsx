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
  };
  className?: string;
}

export function TableDensityControls({
  value,
  totalRows,
  visibleRows,
  onChange,
  labels,
  className,
}: TableDensityControlsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-border py-3 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <p className="text-xs font-semibold text-muted-foreground">
        {labels.rowsShown}: {visibleRows} / {totalRows}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {labels.rowsPerPage}
        </span>
        {tableRowLimitOptions.map((option) => (
          <Button
            key={String(option)}
            type="button"
            variant={value === option ? 'default' : 'outline'}
            size="sm"
            className="h-8 min-w-10 px-3 text-xs font-semibold"
            onClick={() => onChange(option)}
          >
            {option === 'all' ? labels.all : option}
          </Button>
        ))}
      </div>
    </div>
  );
}
