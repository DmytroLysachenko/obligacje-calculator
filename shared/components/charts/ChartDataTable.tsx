'use client';

import { useAppI18n } from '@/i18n/client';

import type { BondValueChartPoint, BondValueChartSeries } from './BondValueChart';

interface ChartDataTableProps {
  data: BondValueChartPoint[];
  series: BondValueChartSeries[];
  formatCurrency: (value: number) => string;
}

export function ChartDataTable({ data, series, formatCurrency }: ChartDataTableProps) {
  const { t } = useAppI18n();

  if (!data.length || !series.length) return null;

  return (
    <details className="border-t border-border pt-3">
      <summary className="ui-focus-ring cursor-pointer rounded-sm text-xs font-semibold text-muted-foreground">
        {t('bonds.simulation.chart_data_table')}
      </summary>
      <div className="mt-3 max-h-80 overflow-auto rounded-md border border-border">
        <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
          <caption className="sr-only">{t('bonds.simulation.chart_data_table')}</caption>
          <thead className="sticky top-0 bg-muted text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">{t('common.date')}</th>
              {series.map((item) => <th key={item.key} scope="col" className="px-3 py-2 font-semibold">{item.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.dateKey ?? point.date} className="border-t border-border">
                <th scope="row" className="whitespace-nowrap px-3 py-2 font-medium">{point.label}</th>
                {series.map((item) => {
                  const value = point[item.key];
                  return <td key={item.key} className="whitespace-nowrap px-3 py-2 tabular-nums">{typeof value === 'number' ? formatCurrency(value) : '—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
