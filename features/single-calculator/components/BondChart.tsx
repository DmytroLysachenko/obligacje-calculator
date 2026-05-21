"use client";
import React from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, Line, ComposedChart, TooltipProps, ReferenceArea, ReferenceLine, } from "recharts";
import { ValueType, NameType, } from "recharts/types/component/DefaultTooltipContent";
import { CalculationResult } from "../../bond-core/types";
import { ChartStep } from "../../bond-core/types";
import { HistoricalAverages } from "../../bond-core/types/scenarios";
import { useAppI18n } from '@/i18n/client';
import { getIntlLocale } from '@/i18n/locale-utils';
import { cn } from "@/lib/utils";
import { ChartContainer } from "@/shared/components/charts/ChartContainer";
import { AppLanguage, buildBondChartDisplayPoints, normalizeBondChartDisplayTimeline, } from "@/shared/lib/bond-display";
import { computeNumericDomain, computeRateDomain, sampleSeriesPoints } from "@/shared/lib/chart-series";
interface BondChartProps {
    results: CalculationResult;
    initialInvestment: number;
    chartStep?: ChartStep;
    showRealValue?: boolean;
    historicalAverages?: HistoricalAverages;
}
interface PayloadEntry {
    name: string;
    value: number;
    color: string;
    dataKey?: string | number;
    payload: Record<string, unknown>;
}
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
    active?: boolean;
    payload?: PayloadEntry[];
    label?: NameType;
    formatCurrency: (value: number) => string;
    t: (key: string) => string;
}
const CustomTooltip = ({ active, payload, label, formatCurrency, t, }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) {
        return null;
    }
    const data = payload[0].payload;
    const isProjected = Boolean(data.isProjected);
    const inflation = data.inflation as number | undefined;
    const nbp = data.nbp as number | undefined;
    const interestRate = data.interestRate as number | undefined;
    const rateSource = data.rateSource as string | undefined;
    const eventLabels = (data.eventLabels as string[] | undefined) ?? [];
    return (<div className="min-w-[240px] rounded-xl border-2 border-primary/20 bg-popover p-4 text-popover-foreground shadow-2xl backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2">
        <p className="text-xs font-black uppercase tracking-widest">{label}</p>
        <span className={cn("rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter", isProjected ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700")}>
          {isProjected ? t("bonds.projected") : t("bonds.historical")}
        </span>
      </div>

      <div className="space-y-3">
        {interestRate !== undefined ? (<div className="mb-2 rounded-lg border border-border/50 bg-muted/30 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                {t('bonds.interest_rate')}
              </span>
              <span className="text-sm font-black text-primary">{interestRate.toFixed(2)}%</span>
            </div>
            {rateSource ? (<p className="mt-1 text-[9px] italic text-muted-foreground">{rateSource}</p>) : null}
          </div>) : null}

        <div className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
          {t('bonds.chart_value_note') || 'Nominal and real lines are the primary reading. Inflation and NBP lines only provide context.'}
        </div>

        <div className="space-y-1.5">
          {payload
            .filter((entry) => ['nominal', 'real'].includes(String(entry.dataKey)))
            .map((entry, index) => (<div key={index} className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}/>
                  {entry.name}:
                </span>
                <span className="font-mono font-black text-primary">
                  {formatCurrency(Number(entry.value))}
                </span>
              </div>))}
        </div>

        {eventLabels.length > 0 ? (<div className="border-t border-dashed border-border/50 pt-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("common.events") || "Events"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {eventLabels.map((eventLabel) => (<span key={eventLabel} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {eventLabel}
                </span>))}
            </div>
          </div>) : null}

        {inflation !== undefined || nbp !== undefined ? (<div className="mt-2 space-y-1.5 border-t border-dashed border-border/50 pt-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("common.context_rates")}
            </p>
            {inflation !== undefined ? (<div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500"/>
                  <span className="font-medium text-muted-foreground">
                    {t("bonds.ref_inflation")}:
                  </span>
                </span>
                <span className="font-black text-orange-600">{inflation.toFixed(2)}%</span>
              </div>) : null}
            {nbp !== undefined ? (<div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400"/>
                  <span className="font-medium text-muted-foreground">
                    {t("bonds.nbp_rate_short")}:
                  </span>
                </span>
                <span className="font-black text-blue-600">{nbp.toFixed(2)}%</span>
              </div>) : null}
          </div>) : null}
      </div>
    </div>);
};
export const BondChart: React.FC<BondChartProps> = ({ results, chartStep = 'yearly', showRealValue = false, }) => {
    const { t, locale: language } = useAppI18n();
    const formatCurrency = React.useMemo(() => (value: number) => new Intl.NumberFormat(getIntlLocale(language), {
        style: "currency",
        currency: "PLN",
        maximumFractionDigits: 0,
    }).format(value), [language]);
    const chartData = React.useMemo(() => {
        const baseDisplayData = buildBondChartDisplayPoints(results.initialInvestment, results.timeline, language as AppLanguage, results.comparisonScenarios, chartStep);
        const normalizedTimeline = normalizeBondChartDisplayTimeline(results.timeline, language as AppLanguage, results.comparisonScenarios);
        const rawData = baseDisplayData.map((point, index) => ({
            label: point.xLabel,
            date: point.xLabel,
            dateKey: point.dateKey,
            nominal: point.nominal,
            real: point.real,
            isProjected: point.isProjected,
            isMaturity: point.isMaturity,
            inflation: point.inflation,
            nbp: point.nbp,
            interestRate: index === 0
                ? undefined
                : normalizedTimeline.find((timelinePoint) => timelinePoint.key === point.key)?.interestRate,
            rateSource: point.rateLabel,
            low: point.low,
            high: point.high,
            eventLabels: point.eventLabels,
        }));
        return sampleSeriesPoints(rawData, 180);
    }, [chartStep, language, results.comparisonScenarios, results.initialInvestment, results.timeline]);
    const leftDomain = React.useMemo(() => computeNumericDomain(chartData.flatMap((point) => [point.nominal, point.real]), {
        minFloor: 0,
        minPadding: 250,
        paddingRatio: 0.08,
    }), [chartData]);
    const rightDomain = React.useMemo(() => computeRateDomain(chartData.flatMap((point) => [point.inflation, point.nbp].filter((value): value is number => typeof value === 'number'))), [chartData]);
    const firstProjectedIndex = React.useMemo(() => chartData.findIndex((point) => point.isProjected), [chartData]);
    return (<ChartContainer height={400}>
      <ResponsiveContainer width="100%" height={400} key={`chart-${chartData.length}`}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
          <defs>
            <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: "bold" }} tickLine={false} axisLine={false} dy={10} minTickGap={30} tickFormatter={(value: string) => {
            if (value.length <= 9) {
                return value;
            }
            return value.slice(0, 9);
        }}/>
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: "bold" }} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} domain={leftDomain}/>
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", opacity: 0.5 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={rightDomain}/>
          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} t={t}/>}/>
          {firstProjectedIndex !== -1 ? (<ReferenceLine x={chartData[firstProjectedIndex].date} stroke="#f59e0b" strokeDasharray="3 3" label={{
                value: t('bonds.projection_start'),
                position: 'top',
                fill: '#f59e0b',
                fontSize: 10,
                fontWeight: 'bold',
            }}/>) : null}
          <ReferenceArea yAxisId="right" y1={1.5} y2={3.5} fill="#10b981" fillOpacity={0.05}/>
          <ReferenceArea yAxisId="right" y1={-5} y2={0} fill="#ef4444" fillOpacity={0.05}/>
          <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{
            fontSize: "10px",
            fontWeight: "black",
            textTransform: "uppercase",
            letterSpacing: '0.05em',
        }}/>
          <Area yAxisId="left" type="monotone" dataKey={showRealValue ? 'real' : 'nominal'} name={showRealValue ? t("common.real_value") : t("common.nominal_value")} stroke={showRealValue ? "#10b981" : "#3b82f6"} strokeWidth={3} fillOpacity={1} fill={showRealValue ? "url(#colorReal)" : "url(#colorNominal)"} isAnimationActive={false}/>
          <Line yAxisId="left" type="monotone" dataKey={showRealValue ? 'nominal' : 'real'} name={showRealValue ? t("common.nominal_value") : t("common.real_value")} stroke={showRealValue ? "#3b82f6" : "#10b981"} strokeWidth={2} strokeOpacity={0.55} dot={false} isAnimationActive={false}/>
          {results.comparisonScenarios ? (<>
              <Line yAxisId="left" type="monotone" dataKey="high" name={t("bonds.inflation.scenarios.high")} stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} isAnimationActive={false}/>
              <Line yAxisId="left" type="monotone" dataKey="low" name={t("bonds.inflation.scenarios.low")} stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} isAnimationActive={false}/>
            </>) : null}
          <Line yAxisId="right" type="monotone" dataKey="inflation" name={t("bonds.ref_inflation")} stroke="#f59e0b" strokeWidth={1.75} strokeDasharray="5 5" dot={false} opacity={0.45} isAnimationActive={false}/>
          <Line yAxisId="right" type="monotone" dataKey="nbp" name={t("bonds.nbp_rate_short")} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} opacity={0.3} isAnimationActive={false}/>
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>);
};





