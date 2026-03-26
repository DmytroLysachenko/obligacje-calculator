"use client";

import React, { useState, useEffect } from "react";
import { useComparison } from "../hooks/useComparison";
import { BondInputsForm } from "../../single-calculator/components/BondInputsForm";
import { BondComparisonContainer } from "./BondComparisonContainer";
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
import { Info, Loader2, Scale, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecalculateButton } from "@/shared/components/RecalculateButton";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: PayloadEntry[];
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
        {payload.map((entry, index) => (
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
    envelopeA,
    envelopeB,
    warningsA,
    warningsB,
    isCalculating,
    calculate,
    updateInputA,
    updateInputB,
    setBondTypeA,
    setBondTypeB,
    isDirty
  } = useComparison();
  const { t, language } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [compareMode, setCompareMode] = useState<'independent' | 'normalized'>('independent');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (isDirty || !resultsA)) {
      calculate();
    }
  };

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
            label: i === 0 ? t('comparison.start') : `${t('common.period')} ${i}`,
            valA: pointA ? pointA.nominalValueAfterInterest : null,
            valB: pointB ? pointB.nominalValueAfterInterest : null,
          };
        })
      : [];

  return (
    <div className="space-y-8 pb-20" onKeyDown={handleKeyDown}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            {t("nav.comparison")}
          </h2>
          <p className="text-muted-foreground mt-2">
            {compareMode === 'independent'
              ? t('comparison.desc_independent')
              : t('comparison.desc_bond_vs_bond')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isCalculating && (
            <span className="text-xs text-muted-foreground flex items-center gap-2 animate-in fade-in duration-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('comparison.updating')}
            </span>
          )}
          {!isCalculating && isDirty && resultsA && (
            <span className="text-xs text-orange-500 flex items-center gap-1 animate-in fade-in duration-500 font-medium">
              <Info className="h-3 w-3" />
              {t('comparison.needs_recalculation')}
            </span>
          )}
          {!isCalculating && !isDirty && resultsA && (
            <span className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in duration-500 font-medium">
              <Check className="h-3 w-3" />
              {t('comparison.up_to_date')}
            </span>
          )}
        </div>
      </header>

      <div className="flex gap-3">
        <Badge
          variant={compareMode === 'independent' ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => setCompareMode('independent')}
        >
          {t('comparison.mode_independent')}
        </Badge>
        <Badge
          variant={compareMode === 'normalized' ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => setCompareMode('normalized')}
        >
          {t('comparison.mode_normalized')}
        </Badge>
      </div>

      {(envelopeA?.dataFreshness || envelopeB?.dataFreshness) && (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-bold">{t('comparison.freshness_status')}:</span>{' '}
          {t(`comparison.status_${envelopeA?.dataFreshness.status ?? 'unknown'}`)} / {t(`comparison.status_${envelopeB?.dataFreshness.status ?? 'unknown'}`)}
          {envelopeA?.dataFreshness.usedFallback || envelopeB?.dataFreshness.usedFallback
            ? ` | ${t('comparison.fallback_used')}`
            : ''}
        </div>
      )}

      {compareMode === 'normalized' ? (
        <BondComparisonContainer />
      ) : (
        <>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-1 font-bold uppercase tracking-widest text-[10px]"
          >
            {t('comparison.scenario_a')}
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
            {t('comparison.scenario_b')}
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
                {t('comparison.desc_bond_vs_bond')}
              </p>
        </div>
      )}

      {isCalculating && !resultsA && (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="font-medium text-primary">
                {t('comparison.live_calculation')}
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
                {t('comparison.performance_over_time')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ChartContainer height={450}>
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
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-blue-100/50 bg-blue-100/20">
                <CardTitle className="text-lg font-black text-blue-900 uppercase tracking-widest">
                  {t('comparison.scenario_a_summary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between items-end border-b border-blue-100 pb-4">
                  <span className="text-xs font-bold text-blue-800/60 uppercase">
                    {t('bonds.net_payout')}:
                  </span>
                  <span className="text-3xl font-black text-blue-700">
                    {formatCurrency(resultsA.netPayoutValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-800/60 uppercase">
                    {t('comparison.net_profit')}:
                  </span>
                  <span className="text-xl font-black text-green-600">
                    +{formatCurrency(resultsA.totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase pt-2">
                  <span>{t('bonds.tax')}:</span>
                  <span>{formatCurrency(resultsA.totalTax)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-emerald-100/50 bg-emerald-100/20">
                <CardTitle className="text-lg font-black text-emerald-900 uppercase tracking-widest">
                  {t('comparison.scenario_b_summary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between items-end border-b border-emerald-100 pb-4">
                  <span className="text-xs font-bold text-emerald-800/60 uppercase">
                    {t('bonds.net_payout')}:
                  </span>
                  <span className="text-3xl font-black text-emerald-700">
                    {formatCurrency(resultsB.netPayoutValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800/60 uppercase">
                    {t('comparison.net_profit')}:
                  </span>
                  <span className="text-xl font-black text-green-600">
                    +{formatCurrency(resultsB.totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase pt-2">
                  <span>{t('bonds.tax')}:</span>
                  <span>{formatCurrency(resultsB.totalTax)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {((warningsA.length + warningsB.length) > 0 ||
            (envelopeA?.calculationNotes.length ?? 0) > 0 ||
            (envelopeB?.calculationNotes.length ?? 0) > 0 ||
            (envelopeA?.dataQualityFlags.length ?? 0) > 0 ||
            (envelopeB?.dataQualityFlags.length ?? 0) > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ label: t('comparison.scenario_a'), envelope: envelopeA, warnings: warningsA }, { label: t('comparison.scenario_b'), envelope: envelopeB, warnings: warningsB }].map((entry) => (
                <Card key={entry.label} className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">{entry.label} Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {entry.envelope?.calculationNotes?.length ? (
                      <ul className="list-disc list-inside space-y-1">
                        {entry.envelope.calculationNotes.map((note, index) => (
                          <li key={`${entry.label}-note-${index}`}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                    {entry.warnings.length ? (
                      <ul className="list-disc list-inside space-y-1 text-orange-700">
                        {entry.warnings.map((warning, index) => (
                          <li key={`${entry.label}-warning-${index}`}>{warning}</li>
                        ))}
                      </ul>
                    ) : null}
                    {entry.envelope?.dataQualityFlags?.length ? (
                      <ul className="list-disc list-inside space-y-1 text-amber-700">
                        {entry.envelope.dataQualityFlags.map((flag, index) => (
                          <li key={`${entry.label}-quality-${index}`}>{flag}</li>
                        ))}
                      </ul>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <RecalculateButton 
        isDirty={isDirty}
        loading={isCalculating}
        onClick={() => calculate()}
      />
        </>
      )}
    </div>
  );
};
