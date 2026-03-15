"use client";

import React, { useState, useEffect } from "react";
import { useComparison } from "../hooks/useComparison";
import { BondInputsForm } from "../../single-calculator/components/BondInputsForm";
import { useLanguage } from "@/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: any[];
  label?: NameType;
  formatCurrency: (val: number) => string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatCurrency,
}: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-border p-3 shadow-xl rounded-none text-popover-foreground min-w-[150px]">
      <p className="font-bold mb-2 border-b pb-1 border-border/50 text-xs">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex justify-between items-center gap-4 text-xs"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-mono font-bold">
              {formatCurrency(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ComparisonContainer: React.FC = () => {
  const {
    inputsA,
    inputsB,
    resultsA,
    resultsB,
    isCalculating,
    calculate,
    updateInputA,
    updateInputB,
    setBondTypeA,
    setBondTypeB,
  } = useComparison();
  const { t, language } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  const formatCurrency = (value: number) => {
    if (!hasMounted) return "---";
    return new Intl.NumberFormat(language === "pl" ? "pl-PL" : "en-GB", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare combined chart data
  const chartData =
    resultsA && resultsB
      ? Array.from({
          length:
            Math.max(resultsA.timeline.length, resultsB.timeline.length) + 1,
        }).map((_, i) => {
          const pointA =
            i === 0
              ? { nominalValueAfterInterest: resultsA.initialInvestment }
              : resultsA.timeline[i - 1];
          const pointB =
            i === 0
              ? { nominalValueAfterInterest: resultsB.initialInvestment }
              : resultsB.timeline[i - 1];

          return {
            label: i === 0 ? "Start" : `Period ${i}`,
            valA: pointA ? pointA.nominalValueAfterInterest : null,
            valB: pointB ? pointB.nominalValueAfterInterest : null,
          };
        })
      : [];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            {t("nav.comparison")}
          </h2>
          <p className="text-muted-foreground mt-2">
            Compare two different bond investment scenarios side-by-side.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => calculate()}
            disabled={isCalculating}
            className="px-8 font-bold shadow-lg shadow-primary/20 gap-2 h-12 min-w-[200px]"
          >
            {isCalculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Scale className="h-4 w-4" />
            )}
            {isCalculating ? "Comparing..." : "Compare Scenarios"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-1 font-bold uppercase tracking-widest text-[10px]"
          >
            Scenario A
          </Badge>
          <BondInputsForm
            inputs={inputsA}
            onUpdate={updateInputA}
            onBondTypeChange={setBondTypeA}
          />
        </div>
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-1 font-bold uppercase tracking-widest text-[10px]"
          >
            Scenario B
          </Badge>
          <BondInputsForm
            inputs={inputsB}
            onUpdate={updateInputB}
            onBondTypeChange={setBondTypeB}
          />
        </div>
      </div>

      {!resultsA && !isCalculating && (
        <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-50 space-y-4">
          <Scale className="h-12 w-12 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            Adjust inputs and click &apos;Compare Scenarios&apos; to see results
          </p>
        </div>
      )}

      {isCalculating && !resultsA && (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="font-medium text-primary">
            Analyzing both scenarios...
          </p>
        </div>
      )}

      {resultsA && resultsB && (
        <div
          className={cn(
            "space-y-8 transition-opacity duration-300",
            isCalculating && "opacity-50 pointer-events-none",
          )}
        >
          <Card className="border shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-muted/30 px-8 py-6 border-b">
              <CardTitle className="text-xl font-black">
                Growth Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div
                className="w-full min-h-[450px] relative"
                style={{ minWidth: 0 }}
              >
                {hasMounted && (
                  <ResponsiveContainer
                    width="100%"
                    height={450}
                    key={`comp-chart-${chartData.length}`}
                  >
                    <AreaChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorA"
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
                          id="colorB"
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
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        tickFormatter={(v: number) =>
                          `${(v / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        content={
                          <CustomTooltip formatCurrency={formatCurrency} />
                        }
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        height={40}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="valA"
                        name={`${inputsA.bondType} (A)`}
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#colorA)"
                        connectNulls
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="valB"
                        name={`${inputsB.bondType} (B)`}
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#colorB)"
                        connectNulls
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-blue-100/50 bg-blue-100/20">
                <CardTitle className="text-lg font-black text-blue-900 uppercase tracking-widest">
                  Scenario A Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between items-end border-b border-blue-100 pb-4">
                  <span className="text-xs font-bold text-blue-800/60 uppercase">
                    Net Payout:
                  </span>
                  <span className="text-3xl font-black text-blue-700">
                    {formatCurrency(resultsA.netPayoutValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-800/60 uppercase">
                    Total Profit:
                  </span>
                  <span className="text-xl font-black text-green-600">
                    +{formatCurrency(resultsA.totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase pt-2">
                  <span>Tax Paid:</span>
                  <span>{formatCurrency(resultsA.totalTax)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-emerald-100/50 bg-emerald-100/20">
                <CardTitle className="text-lg font-black text-emerald-900 uppercase tracking-widest">
                  Scenario B Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between items-end border-b border-emerald-100 pb-4">
                  <span className="text-xs font-bold text-emerald-800/60 uppercase">
                    Net Payout:
                  </span>
                  <span className="text-3xl font-black text-emerald-700">
                    {formatCurrency(resultsB.netPayoutValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800/60 uppercase">
                    Total Profit:
                  </span>
                  <span className="text-xl font-black text-green-600">
                    +{formatCurrency(resultsB.totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase pt-2">
                  <span>Tax Paid:</span>
                  <span>{formatCurrency(resultsB.totalTax)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
