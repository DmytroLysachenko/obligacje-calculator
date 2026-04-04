"use client";

import React from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Line,
  ComposedChart,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import { CalculationResult } from "../../bond-core/types";
import { useLanguage } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";

interface BondChartProps {
  results: CalculationResult;
  initialInvestment: number;
}

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: NameType;
  formatCurrency: (value: number) => string;
  t: (key: string) => string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatCurrency,
  t,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isProjected = data.isProjected;
    const inflation = data.inflation;
    const nbp = data.nbp;

    return (
      <div className="bg-popover border-2 border-primary/20 p-4 shadow-2xl rounded-xl text-popover-foreground min-w-[220px] backdrop-blur-sm bg-opacity-95">
        <div className="flex justify-between items-center mb-3 border-b pb-2 border-border/50">
          <p className="font-black text-xs uppercase tracking-widest">
            {label}
          </p>
          {isProjected !== undefined && (
            <span className={cn(
              "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
              isProjected ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
            )}>
              {isProjected ? t("bonds.projected") : t("bonds.historical")}
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            {payload.filter(e => ['nominal', 'real'].includes(e.dataKey as string)).map((entry, index) => (
              <div
                key={index}
                className="flex justify-between items-center gap-4 text-xs"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}:
                </span>
                <span className="font-mono font-black text-primary">
                  {formatCurrency(Number(entry.value))}
                </span>
              </div>
            ))}
          </div>

          {(inflation !== undefined || nbp !== undefined) && (
            <div className="pt-2 mt-2 border-t border-dashed border-border/50 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t("common.context_rates")}</p>
              {inflation !== undefined && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground font-medium">{t("bonds.ref_inflation")}:</span>
                  </span>
                  <span className="font-black text-orange-600">{inflation.toFixed(2)}%</span>
                </div>
              )}
              {nbp !== undefined && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="text-muted-foreground font-medium">{t("bonds.nbp_rate_short")}:</span>
                  </span>
                  <span className="font-black text-blue-600">{nbp.toFixed(2)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const BondChart: React.FC<BondChartProps> = ({ results }) => {
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === "pl" ? "pl-PL" : "en-GB", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(value);

  const chartData = [
    {
      label: t("common.start"),
      date: results.timeline[0]?.periodLabel || t("common.start"),
      nominal: results.initialInvestment,
      real: results.initialInvestment,
      isProjected: false,
      inflation: results.timeline[0]?.inflationReference,
      nbp: results.timeline[0]?.nbpReference,
    },
    ...results.timeline.map((point) => ({
      label: point.periodLabel,
      date: point.periodLabel,
      nominal: Number(point.nominalValueAfterInterest.toFixed(2)),
      real: Number(point.realValue.toFixed(2)),
      isProjected: point.isProjected,
      inflation: point.inflationReference,
      nbp: point.nbpReference,
    })),
  ];

  return (
    <ChartContainer height={400}>
      <ResponsiveContainer
        width="100%"
        height={400}
        key={`chart-${chartData.length}`}
      >
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
        >
          <defs>
            <linearGradient
              id="colorNominal"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#3b82f6"
                stopOpacity={0.15}
              />
              <stop
                offset="95%"
                stopColor="#3b82f6"
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient
              id="colorReal"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="#10b981"
                stopOpacity={0.15}
              />
              <stop
                offset="95%"
                stopColor="#10b981"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(0,0,0,0.05)"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 'bold' }}
            tickLine={false}
            axisLine={false}
            dy={10}
            minTickGap={30}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 'bold' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", opacity: 0.5 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={<CustomTooltip formatCurrency={formatCurrency} t={t} />}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={40}
            iconType="circle"
            wrapperStyle={{ fontSize: "10px", fontWeight: "black", textTransform: "uppercase", letterSpacing: '0.05em' }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="nominal"
            name={t("common.nominal_value")}
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorNominal)"
            animationDuration={1500}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="real"
            name={t("common.real_value")}
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorReal)"
            animationDuration={1500}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="inflation"
            name={t("bonds.ref_inflation")}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            opacity={0.6}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="nbp"
            name={t("bonds.nbp_rate_short")}
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            opacity={0.4}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
