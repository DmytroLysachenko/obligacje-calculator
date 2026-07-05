'use client';

import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { cn } from '@/lib/utils';

import {
  type BondValueTooltipPayloadEntry,
  buildBondValueTooltipModel,
} from './bond-value-tooltip-model';
import type {
  BondValueChartPoint,
  BondValueChartTooltipGroup,
  BondValueChartTooltipMetric,
} from './BondValueChart';

type ChartTranslate = (key: string) => string;

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  payload?: BondValueTooltipPayloadEntry[];
  label?: NameType;
  formatCurrency: (value: number) => string;
  t: ChartTranslate;
}

function TooltipMetricRow({
  label,
  value,
  color,
  currency = true,
  formatCurrency,
}: BondValueChartTooltipMetric & {
  formatCurrency: (value: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="flex items-center gap-1.5 font-medium">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}:
      </span>
      <span className="font-mono font-semibold text-foreground">
        {currency ? formatCurrency(value) : value.toFixed(2)}
      </span>
    </div>
  );
}

function TooltipEventList({ eventLabels, t }: { eventLabels: string[]; t: ChartTranslate }) {
  if (eventLabels.length === 0) return null;

  return (
    <div className="border-t border-dashed border-border/50 pt-2">
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

function TooltipStatusHeader({
  label,
  isProjected,
  t,
}: {
  label?: NameType;
  isProjected: boolean;
  t: ChartTranslate;
}) {
  return (
    <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
      <p className="ui-meta font-semibold uppercase tracking-[0.08em]">{label}</p>
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

function TooltipInterestRate({
  interestRate,
  rateSource,
  t,
}: {
  interestRate?: number;
  rateSource?: string;
  t: ChartTranslate;
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
      {rateSource ? <p className="mt-1 text-[9px] italic text-muted-foreground">{rateSource}</p> : null}
    </div>
  );
}

function TooltipContextRates({
  inflation,
  nbp,
  t,
  compact = false,
}: {
  inflation?: number;
  nbp?: number;
  t: ChartTranslate;
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
          ? 'mt-2 space-y-1.5 border-t border-dashed border-border/50 pt-2'
          : 'mt-3 grid gap-2 border-t border-dashed border-border/50 pt-3 text-[10px] sm:grid-cols-2'
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

function ScenarioGroupTooltip({
  groups,
  data,
  label,
  formatCurrency,
  t,
}: {
  groups: BondValueChartTooltipGroup[];
  data: BondValueChartPoint;
  label?: NameType;
  formatCurrency: (value: number) => string;
  t: ChartTranslate;
}) {
  const isProjected = Boolean(data.isProjected);
  const inflation = data.inflation;
  const nbp = data.nbp;

  return (
    <div className="min-w-[360px] max-w-[560px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg">
      <TooltipStatusHeader label={label} isProjected={isProjected} t={t} />

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="min-w-0 space-y-3 border-t border-border pt-3 first:border-t-0 md:border-l md:border-t-0 md:pl-4 md:first:border-l-0 md:first:pl-0"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                {group.title}
              </p>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
            </div>
            <TooltipInterestRate
              interestRate={group.interestRate}
              rateSource={group.rateSource}
              t={t}
            />
            <div className="space-y-1.5">
              {group.metrics.map((metric) => (
                <TooltipMetricRow
                  key={`${group.id}-${metric.label}`}
                  {...metric}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
            <TooltipEventList eventLabels={group.eventLabels ?? []} t={t} />
          </div>
        ))}
      </div>

      <TooltipContextRates inflation={inflation} nbp={nbp} t={t} />
    </div>
  );
}

export function BondValueChartTooltip({
  active,
  payload,
  label,
  formatCurrency,
  t,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const model = buildBondValueTooltipModel(data, payload);

  if (model.kind === 'scenario-groups') {
    return (
      <ScenarioGroupTooltip
        groups={model.groups}
        data={data}
        label={label}
        formatCurrency={formatCurrency}
        t={t}
      />
    );
  }

  return (
    <div className="min-w-[240px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg">
      <TooltipStatusHeader label={label} isProjected={model.isProjected} t={t} />

      <div className="space-y-3">
        <TooltipInterestRate
          interestRate={model.interestRate}
          rateSource={model.rateSource}
          t={t}
        />

        <div className="space-y-1.5">
          {model.metrics.map((entry) => (
            <TooltipMetricRow
              key={String(entry.dataKey)}
              label={entry.name}
              value={Number(entry.value)}
              color={entry.color}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>

        <TooltipEventList eventLabels={model.eventLabels} t={t} />

        <TooltipContextRates inflation={model.inflation} nbp={model.nbp} t={t} compact />
      </div>
    </div>
  );
}
