"use client";

import React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { cn } from "@/lib/utils";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { ChartLegendStrip } from "@/shared/components/charts/ChartLegendStrip";
import { ChartStep } from "@/features/bond-core/types";
import { useAppI18n } from "@/i18n/client";

export interface BondValueChartSeries {
  key: string;
  label: string;
  color: string;
  secondary?: boolean;
  dashed?: boolean;
}

export interface BondValueChartPoint {
  label: string;
  date: string;
  dateKey?: string;
  isProjected?: boolean;
  inflation?: number;
  nbp?: number;
  interestRate?: number;
  rateSource?: string;
  eventLabels?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
  payload: BondValueChartPoint;
}

interface BondValueChartProps {
  data: BondValueChartPoint[];
  series: BondValueChartSeries[];
  formatCurrency: (value: number) => string;
  leftDomain: [number, number] | ['auto', 'auto'];
  rightDomain: [number, number] | ['auto', 'auto'];
  summary: string;
  defaultGranularity?: ChartStep;
  onGranularityChange?: (step: ChartStep) => void;
  showContextControls?: boolean;
  ariaLabel: string;
  heightClassName?: string;
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  payload?: PayloadEntry[];
  label?: NameType;
  formatCurrency: (value: number) => string;
  t: (key: string) => string;
}

function CustomTooltip({ active, payload, label, formatCurrency, t }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const isProjected = Boolean(data.isProjected);
  const inflation = data.inflation;
  const nbp = data.nbp;
  const interestRate = data.interestRate;
  const eventLabels = data.eventLabels ?? [];

  return (
    <div className="min-w-[240px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg">
      <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
        <p className="ui-meta font-semibold uppercase tracking-[0.08em]">{label}</p>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
            isProjected ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground",
          )}
        >
          {isProjected ? t("bonds.projected") : t("bonds.historical")}
        </span>
      </div>

      <div className="space-y-3">
        {typeof interestRate === "number" ? (
          <div className="mb-2 rounded-md bg-muted/35 p-2">
            <div className="flex items-center justify-between">
              <span className="ui-meta font-semibold uppercase tracking-[0.08em]">
                {t("bonds.interest_rate")}
              </span>
              <span className="text-sm font-semibold text-foreground">{interestRate.toFixed(2)}%</span>
            </div>
            {data.rateSource ? (
              <p className="mt-1 text-[9px] italic text-muted-foreground">{data.rateSource}</p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          {payload
            .filter((entry) => !["inflation", "nbp"].includes(String(entry.dataKey)))
            .map((entry) => (
              <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(Number(entry.value))}
                </span>
              </div>
            ))}
        </div>

        {eventLabels.length > 0 ? (
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
        ) : null}

        {typeof inflation === "number" || typeof nbp === "number" ? (
          <div className="mt-2 space-y-1.5 border-t border-dashed border-border/50 pt-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("common.context_rates")}
            </p>
            {typeof inflation === "number" ? (
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-muted-foreground">{t("bonds.ref_inflation")}:</span>
                <span className="font-semibold text-warning">{inflation.toFixed(2)}%</span>
              </div>
            ) : null}
            {typeof nbp === "number" ? (
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-muted-foreground">{t("bonds.nbp_rate_short")}:</span>
                <span className="font-semibold text-muted-foreground">{nbp.toFixed(2)}%</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BondValueChart({
  data,
  series,
  formatCurrency,
  leftDomain,
  rightDomain,
  summary,
  defaultGranularity = "yearly",
  onGranularityChange,
  showContextControls = true,
  ariaLabel,
  heightClassName = "h-[360px] md:h-[460px] xl:h-[520px]",
}: BondValueChartProps) {
  const { t } = useAppI18n();
  const [showInflationOverlay, setShowInflationOverlay] = React.useState(false);
  const [showNbpOverlay, setShowNbpOverlay] = React.useState(false);
  const [granularity, setGranularity] = React.useState<ChartStep>(defaultGranularity);
  const showContextAxis = showInflationOverlay || showNbpOverlay;
  const firstProjectedIndex = React.useMemo(() => data.findIndex((point) => point.isProjected), [data]);

  const legendItems = React.useMemo(
    () => [
      ...series.map((item) => ({
        label: item.label,
        color: item.color,
        style: item.dashed ? ("dashed" as const) : undefined,
      })),
      ...(showContextControls && showInflationOverlay
        ? [{ label: t("bonds.ref_inflation"), color: "#C89D4F", style: "dashed" as const }]
        : []),
      ...(showContextControls && showNbpOverlay
        ? [{ label: t("bonds.nbp_rate_short"), color: "#6F7782", style: "dashed" as const }]
        : []),
    ],
    [series, showContextControls, showInflationOverlay, showNbpOverlay, t],
  );

  const handleGranularityChange = (nextStep: ChartStep) => {
    setGranularity(nextStep);
    onGranularityChange?.(nextStep);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-border pb-3 xl:flex-row xl:items-center xl:justify-between">
        <ChartLegendStrip items={legendItems} className="border-b-0 pb-0" />
        <div className="flex flex-wrap items-center gap-2">
          {(["monthly", "quarterly", "yearly"] as ChartStep[]).map((step) => (
            <button
              key={step}
              type="button"
              aria-pressed={granularity === step}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                granularity === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleGranularityChange(step)}
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
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                  showInflationOverlay
                    ? "border-warning bg-warning/10 text-warning"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setShowInflationOverlay((current) => !current)}
              >
                {t("bonds.ref_inflation")}
              </button>
              <button
                type="button"
                aria-pressed={showNbpOverlay}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                  showNbpOverlay
                    ? "border-muted-foreground bg-muted text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setShowNbpOverlay((current) => !current)}
              >
                {t("bonds.nbp_rate_short")}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <ChartContainer
        ariaLabel={ariaLabel}
        summary={<p>{summary}</p>}
        responsiveHeightClassName={heightClassName}
      >
        <ResponsiveContainer width="100%" height="100%" key={`chart-${data.length}`}>
          <ComposedChart data={data} margin={{ top: 12, right: 52, left: 40, bottom: 20 }}>
            <defs>
              {series.map((item) => (
                <linearGradient key={item.key} id={`value-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={item.color} stopOpacity={item.secondary ? 0.06 : 0.12} />
                  <stop offset="95%" stopColor={item.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: "bold" }}
              tickLine={false}
              axisLine={false}
              dy={10}
              minTickGap={30}
              tickFormatter={(value: string) => (value.length <= 9 ? value : value.slice(0, 9))}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: "bold" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`}
              domain={leftDomain}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={44}
              tick={showContextAxis ? { fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: "bold" } : false}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
              domain={rightDomain}
            />
            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} t={t} />} />
            {firstProjectedIndex !== -1 ? (
              <ReferenceLine
                x={data[firstProjectedIndex].label}
                stroke="#C89D4F"
                strokeDasharray="3 3"
                label={{
                  value: t("bonds.projection_start"),
                  position: "top",
                  fill: "#C89D4F",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
            ) : null}
            {series.map((item, index) => {
              const Component = index === 0 ? Area : Line;
              return (
                <Component
                  key={item.key}
                  yAxisId="left"
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={item.secondary ? 2 : 2.25}
                  strokeOpacity={item.secondary ? 0.65 : 1}
                  strokeDasharray={item.dashed ? "4 4" : undefined}
                  fill={index === 0 ? `url(#value-${item.key})` : "transparent"}
                  fillOpacity={index === 0 ? 1 : 0}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
            {showInflationOverlay ? (
              <Line
                yAxisId="right"
                type="stepAfter"
                dataKey="inflation"
                name={t("bonds.ref_inflation")}
                stroke="#C89D4F"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            {showNbpOverlay ? (
              <Line
                yAxisId="right"
                type="stepAfter"
                dataKey="nbp"
                name={t("bonds.nbp_rate_short")}
                stroke="#6F7782"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
