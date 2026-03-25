"use client";

import React from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
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
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatCurrency,
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
              {isProjected ? "Projected" : "Historical"}
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            {payload.map((entry, index) => (
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Context Rates</p>
              {inflation !== undefined && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground font-medium">Ref. Inflation:</span>
                  <span className="font-black text-orange-600">{inflation.toFixed(2)}%</span>
                </div>
              )}
              {nbp !== undefined && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground font-medium">NBP Rate:</span>
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
      label: "Start",
      date: results.timeline[0]?.periodLabel || "Start",
      nominal: results.initialInvestment,
      real: results.initialInvestment,
      isProjected: false,
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
        <AreaChart
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
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            dy={10}
            minTickGap={30}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={<CustomTooltip formatCurrency={formatCurrency} />}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={40}
            iconType="circle"
            wrapperStyle={{ fontSize: "12px", fontWeight: "500" }}
          />
          <Area
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
            type="monotone"
            dataKey="real"
            name={t("common.real_value")}
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorReal)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
