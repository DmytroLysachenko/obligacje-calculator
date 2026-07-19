import type { NameType } from 'recharts/types/component/DefaultTooltipContent';

import { cn } from '@/lib/utils';

import type { BondValueChartTooltipMetric } from './BondValueChart';

export type ChartTooltipTranslate = (key: string) => string;

export function TooltipMetricRow({
  label,
  value,
  color,
  currency = true,
  formatCurrency,
}: BondValueChartTooltipMetric & {
  formatCurrency: (value: number) => string;
}) {
  return (
    <div className="ui-chart-tooltip-row">
      <span className="ui-chart-tooltip-label">
        <span className="ui-chart-tooltip-dot" style={{ backgroundColor: color }} />
        {label}:
      </span>
      <span className="ui-chart-tooltip-value">
        {currency ? formatCurrency(value) : value.toFixed(2)}
      </span>
    </div>
  );
}

export function TooltipEventList({
  eventLabels,
  t,
}: {
  eventLabels: string[];
  t: ChartTooltipTranslate;
}) {
  if (eventLabels.length === 0) return null;

  return (
    <div className="ui-chart-tooltip-context">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {t('common.events') || 'Events'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {eventLabels.map((eventLabel) => (
          <span
            key={eventLabel}
            className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
          >
            {eventLabel}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TooltipStatusHeader({
  label,
  isProjected,
  t,
}: {
  label?: NameType;
  isProjected: boolean;
  t: ChartTooltipTranslate;
}) {
  return (
    <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2">
      <p className="ui-chart-tooltip-heading border-0 pb-0">{label}</p>
      <span
        className={cn(
          'rounded px-1.5 py-0.5 text-[10px] font-semibold',
          isProjected ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground',
        )}
      >
        {isProjected ? t('bonds.projected') : t('bonds.historical')}
      </span>
    </div>
  );
}

export function TooltipInterestRate({
  interestRate,
  rateSource,
  t,
}: {
  interestRate?: number;
  rateSource?: string;
  t: ChartTooltipTranslate;
}) {
  if (typeof interestRate !== 'number') {
    return null;
  }

  return (
    <div className="rounded-md bg-muted/35 p-2">
      <div className="flex items-center justify-between">
        <span className="ui-meta font-semibold uppercase tracking-[0.08em]">
          {t('bonds.interest_rate')}
        </span>
        <span className="text-sm font-semibold text-foreground">{interestRate.toFixed(2)}%</span>
      </div>
      {rateSource ? (
        <p className="mt-1 text-[9px] italic text-muted-foreground">{rateSource}</p>
      ) : null}
    </div>
  );
}

export function TooltipContextRates({
  inflation,
  nbp,
  t,
  compact = false,
}: {
  inflation?: number;
  nbp?: number;
  t: ChartTooltipTranslate;
  compact?: boolean;
}) {
  if (typeof inflation !== 'number' && typeof nbp !== 'number') {
    return null;
  }

  const rowClassName = compact
    ? 'flex items-center justify-between text-[10px]'
    : 'flex items-center justify-between gap-4';

  return (
    <div
      className={
        compact
          ? 'ui-chart-tooltip-context mt-2'
          : 'ui-chart-tooltip-context mt-3 grid gap-2 sm:grid-cols-2'
      }
    >
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {t('common.context_rates')}
      </p>
      <div className="space-y-1.5">
        {typeof inflation === 'number' ? (
          <div className={rowClassName}>
            <span className="font-medium text-muted-foreground">{t('bonds.ref_inflation')}:</span>
            <span className="font-semibold text-warning">{inflation.toFixed(2)}%</span>
          </div>
        ) : null}
        {typeof nbp === 'number' ? (
          <div className={rowClassName}>
            <span className="font-medium text-muted-foreground">{t('bonds.nbp_rate_short')}:</span>
            <span className="font-semibold text-muted-foreground">{nbp.toFixed(2)}%</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
