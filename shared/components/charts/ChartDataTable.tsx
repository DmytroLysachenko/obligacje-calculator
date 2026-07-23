'use client';

import React from 'react';

import { useAppI18n } from '@/i18n/client';

import type { BondValueChartPoint, BondValueChartSeries } from './BondValueChart';

interface ChartDataTableProps {
  data: BondValueChartPoint[];
  series: BondValueChartSeries[];
  formatCurrency: (value: number) => string;
}

export function ChartDataTable({ data, series, formatCurrency }: ChartDataTableProps) {
  const { t } = useAppI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageRows = data.slice((page - 1) * pageSize, page * pageSize);

  if (!data.length || !series.length) return null;

  return (
    <details
      className="border-t border-border pt-3"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="ui-focus-ring cursor-pointer rounded-sm text-xs font-semibold text-muted-foreground">
        {t('bonds.simulation.chart_data_table')}
      </summary>
      {isOpen ? (
        <div className="mt-3 overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
            <caption className="sr-only">{t('bonds.simulation.chart_data_table')}</caption>
            <thead className="sticky top-0 bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  {t('common.date')}
                </th>
                {series.map((item) => (
                  <th key={item.key} scope="col" className="px-3 py-2 font-semibold">
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((point) => (
                <tr key={point.dateKey ?? point.date} className="border-t border-border">
                  <th scope="row" className="whitespace-nowrap px-3 py-2 font-medium">
                    {point.label}
                  </th>
                  {series.map((item) => {
                    const value = point[item.key];
                    return (
                      <td key={item.key} className="whitespace-nowrap px-3 py-2 tabular-nums">
                        {typeof value === 'number' ? formatCurrency(value) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">
                {t('common.rows_shown')}: {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, data.length)} / {data.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="ui-focus-ring min-h-9 rounded-md border border-border px-3 text-xs font-semibold disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  {t('common.previous')}
                </button>
                <button
                  type="button"
                  className="ui-focus-ring min-h-9 rounded-md border border-border px-3 text-xs font-semibold disabled:opacity-50"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </details>
  );
}
