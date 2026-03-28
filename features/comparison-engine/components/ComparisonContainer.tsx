"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import { useComparison } from "../hooks/useComparison";
import { BondComparisonContainer } from "./BondComparisonContainer";
import { useLanguage } from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Info, Loader2, Scale, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecalculateButton } from "@/shared/components/RecalculateButton";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { CalculationMetaPanel } from "@/shared/components/CalculationMetaPanel";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from "recharts";
import { BondType, TaxStrategy } from "@/features/bond-core/types";

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
}

const ScenarioOverrideCard = ({
  title,
  colorClass,
  bondType,
  onBondTypeChange,
  rollover,
  onRolloverChange,
  isRebought,
  onReboughtChange,
  taxStrategy,
  onTaxStrategyChange,
  customHorizonEnabled,
  onCustomHorizonEnabledChange,
  customHorizonMonths,
  onCustomHorizonMonthsChange,
}: {
  title: string;
  colorClass: string;
  bondType: BondType;
  onBondTypeChange: (value: BondType) => void;
  rollover?: boolean;
  onRolloverChange: (value: boolean) => void;
  isRebought?: boolean;
  onReboughtChange: (value: boolean) => void;
  taxStrategy?: TaxStrategy;
  onTaxStrategyChange: (value: TaxStrategy | undefined) => void;
  customHorizonEnabled: boolean;
  onCustomHorizonEnabledChange: (value: boolean) => void;
  customHorizonMonths?: number;
  onCustomHorizonMonthsChange: (value: number | undefined) => void;
}) => {
  const { t, language } = useLanguage();

  return (
    <Card className="border shadow-sm">
      <CardHeader className={cn("border-b pb-4", colorClass)}>
        <CardTitle className="text-sm font-black uppercase tracking-widest">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <Label>{t("bonds.bond_type")}</Label>
          <Select value={bondType} onValueChange={(value) => onBondTypeChange(value as BondType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BondType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type} · {language === "pl" ? "Obligacja" : "Bond"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
          <div>
            <p className="text-sm font-semibold">{t("bonds.reinvest")}</p>
            <p className="text-[11px] text-muted-foreground">{t("bonds.rollover_desc")}</p>
          </div>
          <Switch checked={!!rollover} onCheckedChange={onRolloverChange} />
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
          <div>
            <p className="text-sm font-semibold">{t("bonds.is_rebought")}</p>
            <p className="text-[11px] text-muted-foreground">{t("bonds.is_rebought_desc")}</p>
          </div>
          <Switch checked={!!isRebought} onCheckedChange={onReboughtChange} />
        </div>

        <div className="space-y-2">
          <Label>{t("bonds.tax_strategy")}</Label>
          <Select
            value={taxStrategy ?? "shared"}
            onValueChange={(value) => onTaxStrategyChange(value === "shared" ? undefined : (value as TaxStrategy))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shared">{t("comparison.use_shared_tax")}</SelectItem>
              <SelectItem value={TaxStrategy.STANDARD}>{t("bonds.tax_standard")}</SelectItem>
              <SelectItem value={TaxStrategy.IKE}>{t("bonds.tax_ike")}</SelectItem>
              <SelectItem value={TaxStrategy.IKZE}>{t("bonds.tax_ikze")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
          <div>
            <p className="text-sm font-semibold">{t("comparison.custom_horizon")}</p>
            <p className="text-[11px] text-muted-foreground">{t("comparison.custom_horizon_desc")}</p>
          </div>
          <Switch checked={customHorizonEnabled} onCheckedChange={onCustomHorizonEnabledChange} />
        </div>

        {customHorizonEnabled ? (
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>{t("comparison.scenario_horizon")}</span>
              <span>{Math.max(1, Math.round((customHorizonMonths ?? 12) / 12))} {t("common.years")}</span>
            </div>
            <Slider
              value={[customHorizonMonths ?? 12]}
              min={12}
              max={360}
              step={1}
              onValueChange={([value]) => onCustomHorizonMonthsChange(value)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string;
  formatCurrency: (val: number) => string;
}

const CustomTooltip = ({ active, payload, label, formatCurrency }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="min-w-[150px] rounded-none border border-border bg-popover p-3 text-popover-foreground shadow-xl">
      <p className="mb-2 border-b border-border/50 pb-1 text-xs font-bold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold">{formatCurrency(Number(entry.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ComparisonContainer: React.FC = () => {
  const {
    sharedConfig,
    scenarioA,
    scenarioB,
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
    updateSharedConfig,
    updateScenarioA,
    updateScenarioB,
    setBondTypeA,
    setBondTypeB,
    isDirty,
  } = useComparison();
  const { t, language } = useLanguage();
  const [compareMode, setCompareMode] = useState<"independent" | "normalized">("independent");
  const hasMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (isDirty || !resultsA)) {
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

  const chartData = useMemo(
    () =>
      resultsA && resultsB
        ? Array.from({
            length: Math.max(resultsA.timeline.length, resultsB.timeline.length) + 1,
          }).map((_, index) => {
            const pointA = index === 0 ? { nominalValueAfterInterest: resultsA.initialInvestment } : resultsA.timeline[index - 1];
            const pointB = index === 0 ? { nominalValueAfterInterest: resultsB.initialInvestment } : resultsB.timeline[index - 1];

            return {
              label: index === 0 ? t("comparison.start") : `${t("common.period")} ${index}`,
              valA: pointA?.nominalValueAfterInterest ?? null,
              valB: pointB?.nominalValueAfterInterest ?? null,
            };
          })
        : [],
    [resultsA, resultsB, t],
  );

  return (
    <div className="space-y-8 pb-20" onKeyDown={handleKeyDown}>
      <header className="flex flex-col justify-between gap-6 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            <Scale className="h-8 w-8 text-primary" />
            {t("nav.comparison")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {compareMode === "independent" ? t("comparison.desc_independent") : t("comparison.desc_bond_vs_bond")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isCalculating && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("comparison.updating")}
            </span>
          )}
          {!isCalculating && isDirty && resultsA && (
            <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
              <Info className="h-3 w-3" />
              {t("comparison.needs_recalculation")}
            </span>
          )}
          {!isCalculating && !isDirty && resultsA && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <Check className="h-3 w-3" />
              {t("comparison.up_to_date")}
            </span>
          )}
        </div>
      </header>

      <div className="flex gap-3">
        <Badge variant={compareMode === "independent" ? "default" : "outline"} className="cursor-pointer px-4 py-2" onClick={() => setCompareMode("independent")}>
          {t("comparison.mode_independent")}
        </Badge>
        <Badge variant={compareMode === "normalized" ? "default" : "outline"} className="cursor-pointer px-4 py-2" onClick={() => setCompareMode("normalized")}>
          {t("comparison.mode_normalized")}
        </Badge>
      </div>

      {compareMode === "normalized" ? (
        <BondComparisonContainer />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <Card className="border shadow-sm xl:col-span-1">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest">
                  {t("comparison.shared_scenario")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                <div className="space-y-2">
                  <Label>{t("comparison.initial_sum")}</Label>
                  <Input
                    type="number"
                    value={sharedConfig.initialInvestment}
                    onChange={(e) => updateSharedConfig("initialInvestment", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-3">
                  <Label>{t("comparison.timing_mode")}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={sharedConfig.timingMode !== "exact" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => updateSharedConfig("timingMode", "general")}
                    >
                      {t("comparison.timing_general")}
                    </Button>
                    <Button
                      type="button"
                      variant={sharedConfig.timingMode === "exact" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => updateSharedConfig("timingMode", "exact")}
                    >
                      {t("comparison.timing_exact")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("bonds.purchase_date")}</Label>
                  <Input
                    type="date"
                    value={sharedConfig.purchaseDate}
                    onChange={(e) => updateSharedConfig("purchaseDate", e.target.value)}
                  />
                </div>

                {sharedConfig.timingMode === "exact" ? (
                  <div className="space-y-2">
                    <Label>{t("bonds.withdrawal_date")}</Label>
                    <Input
                      type="date"
                      value={sharedConfig.withdrawalDate}
                      onChange={(e) => updateSharedConfig("withdrawalDate", e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label>{t("bonds.investment_horizon")}</Label>
                      <span className="font-semibold">
                        {Math.round((sharedConfig.investmentHorizonMonths ?? 12) / 12)} {t("common.years")}
                      </span>
                    </div>
                    <Slider
                      value={[sharedConfig.investmentHorizonMonths ?? 12]}
                      min={1}
                      max={360}
                      step={1}
                      onValueChange={([value]) => updateSharedConfig("investmentHorizonMonths", value)}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <Label>{t("bonds.inflation_rate")}</Label>
                    <span className="font-semibold">{sharedConfig.expectedInflation}%</span>
                  </div>
                  <Slider
                    value={[sharedConfig.expectedInflation]}
                    min={-2}
                    max={25}
                    step={0.1}
                    onValueChange={([value]) => updateSharedConfig("expectedInflation", value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <Label>{t("bonds.nbp_rate_label")}</Label>
                    <span className="font-semibold">{sharedConfig.expectedNbpRate ?? 5.25}%</span>
                  </div>
                  <Slider
                    value={[sharedConfig.expectedNbpRate ?? 5.25]}
                    min={0}
                    max={15}
                    step={0.05}
                    onValueChange={([value]) => updateSharedConfig("expectedNbpRate", value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("bonds.tax_strategy")}</Label>
                  <Select
                    value={sharedConfig.taxStrategy ?? TaxStrategy.STANDARD}
                    onValueChange={(value) => updateSharedConfig("taxStrategy", value as TaxStrategy)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaxStrategy.STANDARD}>{t("bonds.tax_standard")}</SelectItem>
                      <SelectItem value={TaxStrategy.IKE}>{t("bonds.tax_ike")}</SelectItem>
                      <SelectItem value={TaxStrategy.IKZE}>{t("bonds.tax_ikze")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 xl:col-span-2">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ScenarioOverrideCard
                  title={t("comparison.scenario_a")}
                  colorClass="bg-blue-50/40"
                  bondType={scenarioA.bondType}
                  onBondTypeChange={setBondTypeA}
                  rollover={scenarioA.rollover}
                  onRolloverChange={(value) => updateScenarioA("rollover", value)}
                  isRebought={scenarioA.isRebought}
                  onReboughtChange={(value) => updateScenarioA("isRebought", value)}
                  taxStrategy={scenarioA.taxStrategy}
                  onTaxStrategyChange={(value) => updateScenarioA("taxStrategy", value)}
                  customHorizonEnabled={scenarioA.investmentHorizonMonths !== undefined}
                  onCustomHorizonEnabledChange={(value) =>
                    updateScenarioA("investmentHorizonMonths", value ? sharedConfig.investmentHorizonMonths : undefined)
                  }
                  customHorizonMonths={scenarioA.investmentHorizonMonths}
                  onCustomHorizonMonthsChange={(value) => updateScenarioA("investmentHorizonMonths", value)}
                />
                <ScenarioOverrideCard
                  title={t("comparison.scenario_b")}
                  colorClass="bg-emerald-50/40"
                  bondType={scenarioB.bondType}
                  onBondTypeChange={setBondTypeB}
                  rollover={scenarioB.rollover}
                  onRolloverChange={(value) => updateScenarioB("rollover", value)}
                  isRebought={scenarioB.isRebought}
                  onReboughtChange={(value) => updateScenarioB("isRebought", value)}
                  taxStrategy={scenarioB.taxStrategy}
                  onTaxStrategyChange={(value) => updateScenarioB("taxStrategy", value)}
                  customHorizonEnabled={scenarioB.investmentHorizonMonths !== undefined}
                  onCustomHorizonEnabledChange={(value) =>
                    updateScenarioB("investmentHorizonMonths", value ? sharedConfig.investmentHorizonMonths : undefined)
                  }
                  customHorizonMonths={scenarioB.investmentHorizonMonths}
                  onCustomHorizonMonthsChange={(value) => updateScenarioB("investmentHorizonMonths", value)}
                />
              </div>

            </div>
          </div>

          {!resultsA && !isCalculating && (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed opacity-50">
              <Scale className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">{t("comparison.desc_independent")}</p>
            </div>
          )}

          {isCalculating && !resultsA && (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-medium text-primary">{t("comparison.live_calculation")}</p>
            </div>
          )}

          {resultsA && resultsB && (
            <div className={cn("space-y-8 transition-opacity duration-300", isCalculating && "pointer-events-none opacity-50")}>
              <Card className="overflow-hidden rounded-3xl border shadow-xl">
                <CardHeader className="border-b bg-muted/30 px-8 py-6">
                  <CardTitle className="text-xl font-black">{t("comparison.performance_over_time")}</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <ChartContainer height={480}>
                    {hasMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} dy={10} />
                          <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`} />
                          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                          <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                          {chartData.length > 12 ? <Brush dataKey="label" height={24} stroke="#64748b" travellerWidth={8} /> : null}
                          <Area type="monotone" dataKey="valA" name={`${inputsA.bondType} (A)`} stroke="#3b82f6" strokeWidth={3} fill="url(#colorA)" connectNulls animationDuration={800} activeDot={{ r: 5 }} />
                          <Area type="monotone" dataKey="valB" name={`${inputsB.bondType} (B)`} stroke="#10b981" strokeWidth={3} fill="url(#colorB)" connectNulls animationDuration={800} activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-blue-50 to-white shadow-lg">
                  <CardHeader className="border-b border-blue-100/50 bg-blue-100/20">
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-blue-900">{t("comparison.scenario_a_summary")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-end justify-between border-b border-blue-100 pb-4">
                      <span className="text-xs font-bold uppercase text-blue-800/60">{t("bonds.net_payout")}:</span>
                      <span className="text-3xl font-black text-blue-700">{formatCurrency(resultsA.netPayoutValue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-blue-800/60">{t("comparison.net_profit")}:</span>
                      <span className="text-xl font-black text-green-600">+{formatCurrency(resultsA.totalProfit)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-[10px] font-bold uppercase text-muted-foreground">
                      <span>{t("bonds.tax")}:</span>
                      <span>{formatCurrency(resultsA.totalTax)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-emerald-50 to-white shadow-lg">
                  <CardHeader className="border-b border-emerald-100/50 bg-emerald-100/20">
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-emerald-900">{t("comparison.scenario_b_summary")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-end justify-between border-b border-emerald-100 pb-4">
                      <span className="text-xs font-bold uppercase text-emerald-800/60">{t("bonds.net_payout")}:</span>
                      <span className="text-3xl font-black text-emerald-700">{formatCurrency(resultsB.netPayoutValue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-emerald-800/60">{t("comparison.net_profit")}:</span>
                      <span className="text-xl font-black text-green-600">+{formatCurrency(resultsB.totalProfit)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-[10px] font-bold uppercase text-muted-foreground">
                      <span>{t("bonds.tax")}:</span>
                      <span>{formatCurrency(resultsB.totalTax)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {((warningsA.length + warningsB.length) > 0 ||
                (envelopeA?.assumptions.length ?? 0) > 0 ||
                (envelopeB?.assumptions.length ?? 0) > 0 ||
                (envelopeA?.calculationNotes.length ?? 0) > 0 ||
                (envelopeB?.calculationNotes.length ?? 0) > 0 ||
                (envelopeA?.dataQualityFlags.length ?? 0) > 0 ||
                (envelopeB?.dataQualityFlags.length ?? 0) > 0 ||
                envelopeA?.dataFreshness ||
                envelopeB?.dataFreshness) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[{ label: t("comparison.scenario_a"), envelope: envelopeA, warnings: warningsA }, { label: t("comparison.scenario_b"), envelope: envelopeB, warnings: warningsB }].map((entry) => (
                    <Card key={entry.label} className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">
                          {entry.label} {t("common.notes")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        <CalculationMetaPanel
                          warnings={entry.warnings}
                          assumptions={entry.envelope?.assumptions}
                          calculationNotes={entry.envelope?.calculationNotes}
                          dataQualityFlags={entry.envelope?.dataQualityFlags}
                          dataFreshness={entry.envelope?.dataFreshness}
                          compact
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <RecalculateButton isDirty={isDirty} loading={isCalculating} onClick={() => calculate()} />
        </>
      )}
    </div>
  );
};
