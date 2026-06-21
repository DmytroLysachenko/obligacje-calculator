"use client";

import React from "react";
import { TooltipProps } from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ChartStep } from "@/features/bond-core/types";
import { cn } from "@/lib/utils";
import { ChartLegendStrip } from "@/shared/components/charts/ChartLegendStrip";
import {
  buildBondValueTooltipModel,
  type BondValueTooltipPayloadEntry,
} from "./bond-value-tooltip-model";
import type {
  BondValueChartPoint,
  BondValueChartTooltipGroup,
  BondValueChartTooltipMetric,
} from "./BondValueChart";

type ChartTranslate = (key: string) => string;

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  payload?: BondValueTooltipPayloadEntry[];
  label?: NameType;
  formatCurrency: (value: number) => string;
  t: ChartTranslate;
}

interface ChartToolbarProps {
  granularity: ChartStep;
  legendItems: React.ComponentProps<typeof ChartLegendStrip>["items"];
  showContextControls: boolean;
  showInflationOverlay: boolean;
  showNbpOverlay: boolean;
  onGranularityChange: (step: ChartStep) => void;
  onOverlayChange: (key: "showInflationOverlay" | "showNbpOverlay", value: boolean) => void;
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

function TooltipEventList({
  eventLabels,
  t,
}: {
  eventLabels: string[];
  t: ChartTranslate;
}) {
  if (eventLabels.length === 0) return null;

  return (
    <div className="border-t border-dashed border-border/50 pt-2">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {t("common.events") || "Events"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {eventLabels.map((eventLabel) => (
          <span key={eventLabel} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {eventLabel}
          </span>
        ))}
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
      <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
        <p className="ui-meta font-semibold uppercase tracking-[0.08em]">{label}</p>
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", isProjected ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground")}>
          {isProjected ? t("bonds.projected") : t("bonds.historical")}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.id} className="min-w-0 space-y-3 border-t border-border pt-3 first:border-t-0 md:border-l md:border-t-0 md:pl-4 md:first:border-l-0 md:first:pl-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">{group.title}</p>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
            </div>
            {typeof group.interestRate === "number" ? (
              <div className="rounded-md bg-muted/35 p-2">
                <div className="flex items-center justify-between">
                  <span className="ui-meta font-semibold uppercase tracking-[0.08em]">{t("bonds.interest_rate")}</span>
                  <span className="text-sm font-semibold text-foreground">{group.interestRate.toFixed(2)}%</span>
                </div>
                {group.rateSource ? <p className="mt-1 text-[9px] italic text-muted-foreground">{group.rateSource}</p> : null}
              </div>
            ) : null}
            <div className="space-y-1.5">
              {group.metrics.map((metric) => (
                <TooltipMetricRow key={`${group.id}-${metric.label}`} {...metric} formatCurrency={formatCurrency} />
              ))}
            </div>
            <TooltipEventList eventLabels={group.eventLabels ?? []} t={t} />
          </div>
        ))}
      </div>

      {typeof inflation === "number" || typeof nbp === "number" ? (
        <div className="mt-3 grid gap-2 border-t border-dashed border-border/50 pt-3 text-[10px] sm:grid-cols-2">
          <p className="font-bold uppercase tracking-widest text-muted-foreground">{t("common.context_rates")}</p>
          <div className="space-y-1.5">
            {typeof inflation === "number" ? (
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-muted-foreground">{t("bonds.ref_inflation")}:</span>
                <span className="font-semibold text-warning">{inflation.toFixed(2)}%</span>
              </div>
            ) : null}
            {typeof nbp === "number" ? (
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-muted-foreground">{t("bonds.nbp_rate_short")}:</span>
                <span className="font-semibold text-muted-foreground">{nbp.toFixed(2)}%</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BondValueChartTooltip({ active, payload, label, formatCurrency, t }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const model = buildBondValueTooltipModel(data, payload);

  if (model.kind === "scenario-groups") {
    return <ScenarioGroupTooltip groups={model.groups} data={data} label={label} formatCurrency={formatCurrency} t={t} />;
  }

  return (
    <div className="min-w-[240px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg">
      <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
        <p className="ui-meta font-semibold uppercase tracking-[0.08em]">{label}</p>
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", model.isProjected ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground")}>
          {model.isProjected ? t("bonds.projected") : t("bonds.historical")}
        </span>
      </div>

      <div className="space-y-3">
        {typeof model.interestRate === "number" ? (
          <div className="mb-2 rounded-md bg-muted/35 p-2">
            <div className="flex items-center justify-between">
              <span className="ui-meta font-semibold uppercase tracking-[0.08em]">{t("bonds.interest_rate")}</span>
              <span className="text-sm font-semibold text-foreground">{model.interestRate.toFixed(2)}%</span>
            </div>
            {model.rateSource ? <p className="mt-1 text-[9px] italic text-muted-foreground">{model.rateSource}</p> : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          {model.metrics.map((entry) => (
            <TooltipMetricRow key={String(entry.dataKey)} label={entry.name} value={Number(entry.value)} color={entry.color} formatCurrency={formatCurrency} />
          ))}
        </div>

        <TooltipEventList eventLabels={model.eventLabels} t={t} />

        {typeof model.inflation === "number" || typeof model.nbp === "number" ? (
          <div className="mt-2 space-y-1.5 border-t border-dashed border-border/50 pt-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("common.context_rates")}</p>
            {typeof model.inflation === "number" ? (
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-muted-foreground">{t("bonds.ref_inflation")}:</span>
                <span className="font-semibold text-warning">{model.inflation.toFixed(2)}%</span>
              </div>
            ) : null}
            {typeof model.nbp === "number" ? (
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-muted-foreground">{t("bonds.nbp_rate_short")}:</span>
                <span className="font-semibold text-muted-foreground">{model.nbp.toFixed(2)}%</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BondValueChartToolbar({
  granularity,
  legendItems,
  showContextControls,
  showInflationOverlay,
  showNbpOverlay,
  onGranularityChange,
  onOverlayChange,
  t,
}: ChartToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-3 xl:flex-row xl:items-center xl:justify-between">
      <ChartLegendStrip items={legendItems} className="border-b-0 pb-0" />
      <div className="flex flex-wrap items-center gap-2">
        {(["monthly", "quarterly", "yearly"] as ChartStep[]).map((step) => (
          <button
            key={step}
            type="button"
            aria-pressed={granularity === step}
            className={cn("rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors", granularity === step ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground")}
            onClick={() => onGranularityChange(step)}
          >
            {t(`bonds.chart.periods.${step}`)}
          </button>
        ))}
        {showContextControls ? (
          <>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <button
              type="button"
              aria-pressed={showInflationOverlay}
              className={cn("rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors", showInflationOverlay ? "border-warning bg-warning/10 text-warning" : "border-border bg-background text-muted-foreground hover:text-foreground")}
              onClick={() => onOverlayChange("showInflationOverlay", !showInflationOverlay)}
            >
              {t("bonds.ref_inflation")}
            </button>
            <button
              type="button"
              aria-pressed={showNbpOverlay}
              className={cn("rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors", showNbpOverlay ? "border-muted-foreground bg-muted text-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground")}
              onClick={() => onOverlayChange("showNbpOverlay", !showNbpOverlay)}
            >
              {t("bonds.nbp_rate_short")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
