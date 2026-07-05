'use client';

import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import {
  type BondValueTooltipPayloadEntry,
  buildBondValueTooltipModel,
} from './bond-value-tooltip-model';
import type { BondValueChartPoint, BondValueChartTooltipGroup } from './BondValueChart';
import {
  type ChartTooltipTranslate,
  TooltipContextRates,
  TooltipEventList,
  TooltipInterestRate,
  TooltipMetricRow,
  TooltipStatusHeader,
} from './BondValueChartTooltipPrimitives';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  payload?: BondValueTooltipPayloadEntry[];
  label?: NameType;
  formatCurrency: (value: number) => string;
  t: ChartTooltipTranslate;
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
  t: ChartTooltipTranslate;
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
