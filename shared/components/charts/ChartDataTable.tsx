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
  // Keep DOM work bounded even for long recurring-investment timelines.
  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageRows = data.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

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
        <div
          className="mt-3 rounded-md border border-border"
          aria-label={t('bonds.simulation.chart_data_table')}
        >
          <div className="md:hidden">
            <ol
              className="divide-y divide-border"
              aria-label={t('bonds.simulation.chart_data_table')}
            >
              {pageRows.map((point) => (
                <li key={point.dateKey ?? point.date} className="space-y-3 px-4 py-4">
                  <p className="text-sm font-semibold text-foreground">{point.label}</p>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    {series.map((item) => {
                      const value = point[item.key];
                      return (
                        <div
                          key={item.key}
                          className="flex items-baseline justify-between gap-3 border-b border-border/70 pb-2"
                        >
                          <dt className="text-xs leading-5 text-muted-foreground">{item.label}</dt>
                          <dd className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                            {typeof value === 'number' ? formatCurrency(value) : '—'}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </li>
              ))}
            </ol>
          </div>
          <div className="hidden overflow-x-auto md:block" tabIndex={0}>
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
                  <tr
                    key={point.dateKey ?? point.date}
                    className="border-t border-border [content-visibility:auto]"
                  >
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
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {t('common.rows_shown')}: {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, data.length)} / {data.length}
              </p>
              <div className="flex gap-2" aria-label={t('bonds.simulation.chart_data_table')}>
                <button
                  type="button"
                  className="ui-focus-ring min-h-11 rounded-md border border-border px-3 text-xs font-semibold disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  {t('common.previous')}
                </button>
                <button
                  type="button"
                  className="ui-focus-ring min-h-11 rounded-md border border-border px-3 text-xs font-semibold disabled:opacity-50"
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
