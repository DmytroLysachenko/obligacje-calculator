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
import { Loader2, Scale, History, Target, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecalculateButton } from "@/shared/components/RecalculateButton";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { CalculationMetaPanel } from "@/shared/components/CalculationMetaPanel";
import { CalculatorPageShell } from "@/shared/components/CalculatorPageShell";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { pl, enGB } from "date-fns/locale";
import { toDateString } from "@/shared/lib/date-timing";

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
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className={cn("border-b pb-4", colorClass)}>
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t("bonds.bond_type")}</Label>
          <Select value={bondType} onValueChange={(value) => onBondTypeChange(value as BondType)}>
            <SelectTrigger className="h-11 font-bold">
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
            <p className="text-sm font-bold">{t("bonds.reinvest")}</p>
            <p className="text-[10px] text-muted-foreground font-medium italic">{t("bonds.rollover_desc")}</p>
          </div>
          <Switch checked={!!rollover} onCheckedChange={onRolloverChange} />
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
          <div>
            <p className="text-sm font-bold">{t("bonds.is_rebought")}</p>
            <p className="text-[10px] text-muted-foreground font-medium italic">{t("bonds.is_rebought_desc")}</p>
          </div>
          <Switch checked={!!isRebought} onCheckedChange={onReboughtChange} />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t("bonds.tax_strategy")}</Label>
          <Select
            value={taxStrategy ?? "shared"}
            onValueChange={(value) => onTaxStrategyChange(value === "shared" ? undefined : (value as TaxStrategy))}
          >
            <SelectTrigger className="h-11">
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
            <p className="text-sm font-bold">{t("comparison.custom_horizon")}</p>
            <p className="text-[10px] text-muted-foreground font-medium italic">{t("comparison.custom_horizon_desc")}</p>
          </div>
          <Switch checked={customHorizonEnabled} onCheckedChange={onCustomHorizonEnabledChange} />
        </div>

        {customHorizonEnabled ? (
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <span>{t("comparison.scenario_horizon")}</span>
              <span className="text-primary font-black">
                {Math.max(1, Math.round((customHorizonMonths ?? 12) / 12))} {t("common.years")}
              </span>
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

  const headerActions = (
    <div className="flex gap-2 mr-4 bg-muted/50 p-1 rounded-xl border">
      <Badge 
        variant={compareMode === "independent" ? "default" : "ghost"} 
        className={cn("cursor-pointer px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", 
          compareMode === "independent" ? "shadow-md" : "hover:bg-background/50")}
        onClick={() => setCompareMode("independent")}
      >
        {t("comparison.mode_independent")}
      </Badge>
      <Badge 
        variant={compareMode === "normalized" ? "default" : "ghost"} 
        className={cn("cursor-pointer px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", 
          compareMode === "normalized" ? "shadow-md" : "hover:bg-background/50")}
        onClick={() => setCompareMode("normalized")}
      >
        {t("comparison.mode_normalized")}
      </Badge>
    </div>
  );

  return (
    <CalculatorPageShell
      title={t("nav.comparison")}
      description={compareMode === "independent" ? t("comparison.desc_independent") : t("comparison.desc_bond_vs_bond")}
      icon={<Scale className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={!!resultsA}
      extraHeaderActions={headerActions}
      onKeyDown={handleKeyDown}
    >
      {compareMode === "normalized" ? (
        <BondComparisonContainer />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <Card className="border shadow-lg xl:col-span-1 border-primary/10 overflow-hidden">
              <CardHeader className="border-b bg-muted/30 pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  {t("comparison.shared_scenario")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('comparison.timing_mode')}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={(!sharedConfig.timingMode || sharedConfig.timingMode === 'general') ? 'default' : 'outline'}
                      className="flex-1 h-10 text-xs font-bold"
                      onClick={() => updateSharedConfig('timingMode', 'general')}
                    >
                      {t('bonds.timing_general')}
                    </Button>
                    <Button
                      type="button"
                      variant={sharedConfig.timingMode === 'exact' ? 'default' : 'outline'}
                      className="flex-1 h-10 text-xs font-bold"
                      onClick={() => updateSharedConfig('timingMode', 'exact')}
                    >
                      {t('bonds.timing_exact')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t("comparison.initial_sum")}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      className="h-11 pr-12 font-bold text-lg"
                      value={sharedConfig.initialInvestment}
                      onChange={(e) => updateSharedConfig("initialInvestment", Number(e.target.value))}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs">PLN</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2 border-t border-dashed">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      {t('bonds.start_date')}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-bold h-11 px-3 border-2",
                            !sharedConfig.purchaseDate && "text-muted-foreground"
                          )}
                        >
                          <History className="mr-2 h-4 w-4 text-primary" />
                          {sharedConfig.purchaseDate ? format(parseISO(sharedConfig.purchaseDate), 'PPP', { locale: language === 'pl' ? pl : enGB }) : <span>{t('bonds.pick_date')}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          fromYear={2010}
                          toYear={2050}
                          selected={parseISO(sharedConfig.purchaseDate)}
                          onSelect={(date) => date && updateSharedConfig('purchaseDate', toDateString(date))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {sharedConfig.timingMode === 'exact' ? (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        {t('bonds.withdrawal_date')}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-bold h-11 px-3 border-2",
                              !sharedConfig.withdrawalDate && "text-muted-foreground"
                            )}
                          >
                            <History className="mr-2 h-4 w-4 text-primary" />
                            {sharedConfig.withdrawalDate ? format(parseISO(sharedConfig.withdrawalDate), 'PPP', { locale: language === 'pl' ? pl : enGB }) : <span>{t('bonds.pick_date')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            fromYear={2010}
                            toYear={2050}
                            selected={parseISO(sharedConfig.withdrawalDate)}
                            onSelect={(date) => date && updateSharedConfig('withdrawalDate', toDateString(date))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 pt-2 border-t border-dashed">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('bonds.investment_horizon')}</Label>
                    <span className="text-xl font-black text-primary">
                      {Math.max(1, Math.round((sharedConfig.investmentHorizonMonths ?? 120) / 12))} {t('common.years')}
                    </span>
                  </div>
                  <Slider
                    value={[sharedConfig.investmentHorizonMonths ?? 120]}
                    min={12}
                    max={360}
                    step={1}
                    onValueChange={([value]) => updateSharedConfig('investmentHorizonMonths', value)}
                  />
                </div>

                <div className="space-y-4 pt-2 border-t border-dashed">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t("bonds.inflation_rate")} (%)</Label>
                    <span className="text-xl font-black text-primary">{sharedConfig.expectedInflation}%</span>
                  </div>
                  <Slider
                    value={[sharedConfig.expectedInflation]}
                    min={-2}
                    max={25}
                    step={0.1}
                    onValueChange={([value]) => updateSharedConfig("expectedInflation", value)}
                  />
                </div>

                <div className="space-y-4 pt-2 border-t border-dashed">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t("bonds.nbp_rate_label")} (%)</Label>
                    <span className="text-xl font-black text-primary">{sharedConfig.expectedNbpRate ?? 5.25}%</span>
                  </div>
                  <Slider
                    value={[sharedConfig.expectedNbpRate ?? 5.25]}
                    min={0}
                    max={15}
                    step={0.05}
                    onValueChange={([value]) => updateSharedConfig("expectedNbpRate", value)}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-dashed">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t("bonds.tax_strategy")}</Label>
                  <Select
                    value={sharedConfig.taxStrategy ?? TaxStrategy.STANDARD}
                    onValueChange={(value) => updateSharedConfig("taxStrategy", value as TaxStrategy)}
                  >
                    <SelectTrigger className="h-11">
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
                  colorClass="bg-blue-100/30 text-blue-900"
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
                  colorClass="bg-emerald-100/30 text-emerald-900"
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

              {!resultsA && !isCalculating && (
                <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed border-primary/10 opacity-50 bg-muted/5">
                  <Scale className="h-12 w-12 text-muted-foreground" />
                  <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">{t("comparison.desc_independent")}</p>
                </div>
              )}

              {isCalculating && !resultsA && (
                <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="font-black text-primary uppercase tracking-widest text-xs">{t("comparison.live_calculation")}</p>
                </div>
              )}

              {resultsA && resultsB && (
                <div className={cn("space-y-8 transition-opacity duration-300", isCalculating && "opacity-50")}>
                  <Card className="overflow-hidden rounded-3xl border shadow-xl border-primary/5">
                    <CardHeader className="border-b bg-muted/30 px-8 py-6">
                      <CardTitle className="text-xl font-black flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-primary" />
                        {t("comparison.performance_over_time")}
                      </CardTitle>
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
                              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} dy={10} fontWeight="bold" />
                              <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`} />
                              <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                              <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "black", textTransform: "uppercase" }} />
                              {chartData.length > 12 ? <Brush dataKey="label" height={24} stroke="#cbd5e1" travellerWidth={8} /> : null}
                              <Area type="monotone" dataKey="valA" name={`${inputsA.bondType} (A)`} stroke="#3b82f6" strokeWidth={4} fill="url(#colorA)" connectNulls animationDuration={800} activeDot={{ r: 6, strokeWidth: 0 }} />
                              <Area type="monotone" dataKey="valB" name={`${inputsB.bondType} (B)`} stroke="#10b981" strokeWidth={4} fill="url(#colorB)" connectNulls animationDuration={800} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-blue-50/50 to-white shadow-lg border border-blue-100/50">
                      <CardHeader className="border-b border-blue-100/50 bg-blue-100/20">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-900">{t("comparison.scenario_a_summary")}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex items-end justify-between border-b border-blue-100/50 pb-4">
                          <span className="text-[10px] font-black uppercase text-blue-800/60">{t("bonds.net_payout")}:</span>
                          <span className="text-3xl font-black text-blue-700">{formatCurrency(resultsA.netPayoutValue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-blue-800/60">{t("comparison.net_profit")}:</span>
                          <span className="text-xl font-black text-green-600">+{formatCurrency(resultsA.totalProfit)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 text-[10px] font-black uppercase text-muted-foreground/60">
                          <span>{t("bonds.tax")}:</span>
                          <span>{formatCurrency(resultsA.totalTax)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-emerald-50/50 to-white shadow-lg border border-emerald-100/50">
                      <CardHeader className="border-b border-emerald-100/50 bg-emerald-100/20">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-900">{t("comparison.scenario_b_summary")}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex items-end justify-between border-b border-emerald-100/50 pb-4">
                          <span className="text-[10px] font-black uppercase text-emerald-800/60">{t("bonds.net_payout")}:</span>
                          <span className="text-3xl font-black text-emerald-700">{formatCurrency(resultsB.netPayoutValue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-emerald-800/60">{t("comparison.net_profit")}:</span>
                          <span className="text-xl font-black text-green-600">+{formatCurrency(resultsB.totalProfit)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 text-[10px] font-black uppercase text-muted-foreground/60">
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {[{ label: t("comparison.scenario_a"), envelope: envelopeA, warnings: warningsA }, { label: t("comparison.scenario_b"), envelope: envelopeB, warnings: warningsB }].map((entry) => (
                        <Card key={entry.label} className="border shadow-md border-primary/5">
                          <CardHeader className="pb-3 border-b bg-muted/10">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                              {entry.label} {t("common.notes")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-4">
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
            </div>
          </div>

          <RecalculateButton isDirty={isDirty} loading={isCalculating} onClick={() => calculate()} />
        </>
      )}
    </CalculatorPageShell>
  );
};
