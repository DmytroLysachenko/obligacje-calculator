'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addYears, compareAsc, format, parseISO } from 'date-fns';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { AlertTriangle, CheckCircle2, Loader2, Scale, TrendingUp, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { getBondSupportMeta } from '@/features/bond-core/support-matrix';
import { BondComparisonCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { ReadingChecklist } from '@/shared/components/ReadingChecklist';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { SecondaryInsightAccordion } from '@/shared/components/SecondaryInsightAccordion';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';
import { sampleSeriesPoints } from '@/shared/lib/chart-series';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getIntlLocale } from '@/i18n/locale-utils';
type ChartDataPoint = {
    date: string;
    year: number;
} & Partial<Record<BondType, number>>;
function formatPct(value: number) {
    return `${value.toFixed(1)}%`;
}
function StepCard({ title, description, }: {
    title: string;
    description: string;
}) {
    return (<div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary"/>
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>
    </div>);
}
function ResultMetric({ label, value, tone = 'text-slate-950', }: {
    label: string;
    value: string;
    tone?: string;
}) {
    return (<div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={cn('mt-2 text-2xl font-black', tone)}>{value}</p>
    </div>);
}
function SectionBlock({ title, description, children, }: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (<section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        {description ? (<p className="max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>) : null}
      </div>
      {children}
    </section>);
}
export const BondComparisonContainer = () => {
    const { locale: language, t } = useAppI18n();
    const { definitions } = useBondDefinitions();
    const [initialInvestment, setInitialInvestment] = useState(10000);
    const [expectedInflation, setExpectedInflation] = useState(3.5);
    const [expectedNbpRate, setExpectedNbpRate] = useState(5.25);
    const [customInflation, setCustomInflation] = useState<number[] | undefined>(undefined);
    const [inflationScenario, setInflationScenario] = useState<'low' | 'base' | 'high'>('base');
    const [duration, setDuration] = useState(10);
    const [selectedBonds, setSelectedBonds] = useState<BondType[]>([
        BondType.EDO,
        BondType.COI,
        BondType.ROR,
    ]);
    const [envelope, setEnvelope] = useState<BondComparisonCalculationEnvelope | null>(null);
    const [loading, setLoading] = useState(false);
    const [showRealValue, setShowRealValue] = useState(false);
    const [isDirty, setIsDirty] = useState(true);
    useEffect(() => {
        if (!customInflation) {
            return;
        }
        const nextLength = Math.max(1, Math.round(duration));
        if (customInflation.length === nextLength) {
            return;
        }
        setCustomInflation(Array.from({ length: nextLength }, (_, index) => customInflation[index] ?? expectedInflation));
    }, [customInflation, duration, expectedInflation]);
    const results = useMemo(() => (Array.isArray(envelope?.result) ? envelope.result : []), [envelope]);
    const purchaseDate = new Date().toISOString().split('T')[0];
    const withdrawalDate = addYears(new Date(purchaseDate), duration)
        .toISOString()
        .split('T')[0];
    const calculateComparison = useCallback(async () => {
        if (selectedBonds.length === 0) {
            return;
        }
        setLoading(true);
        setIsDirty(false);
        try {
            const response = await fetch('/api/calculate/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'normalized',
                    bondTypes: selectedBonds,
                    initialInvestment,
                    purchaseDate,
                    withdrawalDate,
                    expectedInflation,
                    expectedNbpRate,
                    customInflation,
                    inflationScenario,
                    taxStrategy: TaxStrategy.STANDARD,
                }),
            });
            const data = await response.json();
            const nextEnvelope = data?.data ?? data;
            setEnvelope(nextEnvelope);
        }
        catch (error) {
            console.error('Comparison failed:', error);
        }
        finally {
            setLoading(false);
        }
    }, [
        customInflation,
        expectedInflation,
        expectedNbpRate,
        inflationScenario,
        initialInvestment,
        purchaseDate,
        selectedBonds,
        withdrawalDate,
    ]);
    const onUpdateAssumption = (key: string, value: unknown) => {
        setIsDirty(true);
        if (key === 'expectedInflation')
            setExpectedInflation(value as number);
        if (key === 'expectedNbpRate')
            setExpectedNbpRate(value as number);
        if (key === 'customInflation') {
            const nextPath = value as number[] | undefined;
            setCustomInflation(nextPath
                ? Array.from({ length: Math.max(1, Math.round(duration)) }, (_, index) => nextPath[index] ?? expectedInflation)
                : undefined);
        }
        if (key === 'inflationScenario')
            setInflationScenario(value as 'low' | 'base' | 'high');
    };
    const toggleBond = (type: BondType) => {
        setIsDirty(true);
        setSelectedBonds((prev) => prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]);
    };
    const chartData = useMemo(() => {
        if (results.length === 0)
            return [];
        const allDates = Array.from(new Set(results.flatMap((result) => result.result.timeline.map((point) => point.cycleEndDate))))
            .map((date) => parseISO(date))
            .sort(compareAsc);
        const projected = allDates.map((date) => {
            const row: ChartDataPoint = {
                date: format(date, 'MMM yyyy'),
                year: date.getFullYear(),
            };
            results.forEach((result) => {
                let currentValue = result.result.initialInvestment;
                for (const point of result.result.timeline) {
                    if (compareAsc(parseISO(point.cycleEndDate), date) <= 0) {
                        currentValue = showRealValue ? point.realValue : point.totalValue;
                    }
                    else {
                        break;
                    }
                }
                row[result.type] = currentValue;
            });
            return row;
        });
        return sampleSeriesPoints(projected, 180);
    }, [results, showRealValue]);
    const formatCurrency = (value: number) => new Intl.NumberFormat(getIntlLocale(language), {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    }).format(value);
    const bestResult = useMemo(() => {
        if (results.length === 0) {
            return null;
        }
        return results.reduce((best, current) => current.result.netPayoutValue > best.result.netPayoutValue ? current : best);
    }, [results]);
    const comparisonReadingGuide = [
        t("generated.features.comparison_engine.components.bond_comparison_container.item_2"),
        t("generated.features.comparison_engine.components.bond_comparison_container.item_3"),
        t("generated.features.comparison_engine.components.bond_comparison_container.item_4"),
    ];
    return (<div className="space-y-6 pb-20 md:space-y-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-8">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
            <CardHeader className="space-y-3 border-b border-slate-200 pb-5">
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
                <Scale className="h-5 w-5 text-primary"/>
                {t("generated.features.comparison_engine.components.bond_comparison_container.item_5")}
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-slate-600">
                {t("generated.features.comparison_engine.components.bond_comparison_container.item_6")}
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-6 p-5 md:p-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t("generated.features.comparison_engine.components.bond_comparison_container.item_7")}
                </Label>
                <CommittedSliderInput value={initialInvestment} min={1000} max={100000} step={100} unit="PLN" onCommit={(value) => {
            setInitialInvestment(value);
            setIsDirty(true);
        }}/>
              </div>

              <div className="space-y-2 border-t border-dashed border-slate-200 pt-5">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t("generated.features.comparison_engine.components.bond_comparison_container.item_8")}
                </Label>
                <CommittedSliderInput value={duration} min={1} max={30} step={1} unit={t('common.years')} onCommit={(value) => {
            setDuration(value);
            setIsDirty(true);
        }}/>
              </div>

              <div className="space-y-4 border-t border-dashed border-slate-200 pt-5">
                <MarketAssumptionsForm expectedInflation={expectedInflation} expectedNbpRate={expectedNbpRate} customInflation={customInflation} inflationScenario={inflationScenario} bondType={selectedBonds.includes(BondType.ROR) ||
            selectedBonds.includes(BondType.DOR)
            ? BondType.ROR
            : BondType.EDO} inflationHorizonYears={duration} onUpdate={(key, value) => onUpdateAssumption(String(key), value)} compact/>
              </div>

              <div className="space-y-3 border-t border-dashed border-slate-200 pt-5">
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {t('bonds.inflation.adjusted')}
                    </p>
                    <p className="text-xs leading-6 text-slate-600">
                      {t("generated.features.comparison_engine.components.bond_comparison_container.item_9")}
                    </p>
                  </div>
                  <Switch checked={showRealValue} onCheckedChange={setShowRealValue}/>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {t("generated.features.comparison_engine.components.bond_comparison_container.item_10")}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-slate-600">
                    {t("generated.features.comparison_engine.components.bond_comparison_container.item_11")}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
            <CardHeader className="space-y-3 border-b border-slate-200 pb-5">
              <CardTitle className="text-lg font-black tracking-tight text-slate-950">
                {t("generated.features.comparison_engine.components.bond_comparison_container.item_12")}
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-slate-600">
                {t("generated.features.comparison_engine.components.bond_comparison_container.item_13")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 p-6">
              {Object.values(BondType).map((type) => (<Button key={type} variant={selectedBonds.includes(type) ? 'default' : 'outline'} className={cn('h-auto min-h-14 justify-start rounded-2xl px-3 py-3 text-left', !selectedBonds.includes(type) && 'text-slate-700')} onClick={() => toggleBond(type)}>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-black uppercase tracking-wide">{type}</span>
                    <span className={cn('mt-1 text-[10px] font-medium normal-case opacity-80', selectedBonds.includes(type)
                ? 'text-primary-foreground/85'
                : 'text-slate-500')}>
                      {getBondSupportMeta(type).shortLabel}
                    </span>
                  </div>
                </Button>))}
            </CardContent>
          </Card>

          <SecondaryInsightAccordion title={t("generated.features.comparison_engine.components.bond_comparison_container.item_14")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_15")} badge={t("generated.features.comparison_engine.components.bond_comparison_container.item_16")}>
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2 font-black tracking-tight text-slate-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600"/>
                  {t("generated.features.comparison_engine.components.bond_comparison_container.item_17")}
                </div>
                <div className="mt-3">
                  <ReadingChecklist items={comparisonReadingGuide}/>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <StepCard title={t("generated.features.comparison_engine.components.bond_comparison_container.item_18")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_19")}/>
                <StepCard title={t("generated.features.comparison_engine.components.bond_comparison_container.item_20")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_21")}/>
                <StepCard title={t("generated.features.comparison_engine.components.bond_comparison_container.item_22")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_23")}/>
              </div>
            </div>
          </SecondaryInsightAccordion>
        </aside>

        <div className="space-y-8">
          {!results.length && !loading ? (<Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
              <CardContent className="space-y-6 p-5 md:p-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                    <TrendingUp className="h-3.5 w-3.5 text-primary"/>
                    {t('comparison.ready_to_compare')}
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-slate-950">
                    {t("generated.features.comparison_engine.components.bond_comparison_container.item_24")}
                  </h3>
                  <p className="max-w-3xl text-sm leading-8 text-slate-600">
                    {t("generated.features.comparison_engine.components.bond_comparison_container.item_25")}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <StepCard title={t("generated.features.comparison_engine.components.bond_comparison_container.item_26")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_27")}/>
                  <StepCard title={t("generated.features.comparison_engine.components.bond_comparison_container.item_28")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_29")}/>
                  <StepCard title={t("generated.features.comparison_engine.components.bond_comparison_container.item_30")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_31")}/>
                </div>

              </CardContent>
            </Card>) : null}

          {loading && !results.length ? (<div className="flex h-[420px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
              <Loader2 className="h-10 w-10 animate-spin text-primary"/>
            </div>) : null}

          {results.length ? (<div className="space-y-10">
              {isDirty ? (<div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                  {t("generated.features.comparison_engine.components.bond_comparison_container.item_32")}
                </div>) : null}

              <SectionBlock title={t("generated.features.comparison_engine.components.bond_comparison_container.item_33")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_34")}>
                <div className="grid gap-4 lg:grid-cols-3">
                  <ResultMetric label={t("generated.features.comparison_engine.components.bond_comparison_container.item_35")} value={bestResult ? bestResult.type : '-'}/>
                  <ResultMetric label={showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout')} value={bestResult
                ? formatCurrency(showRealValue
                    ? bestResult.result.finalRealValue
                    : bestResult.result.netPayoutValue)
                : '-'} tone="text-emerald-700"/>
                  <ResultMetric label={t("generated.features.comparison_engine.components.bond_comparison_container.item_36")} value={String(results.length)}/>
                </div>
              </SectionBlock>

              <SectionBlock title={t("generated.features.comparison_engine.components.bond_comparison_container.item_37")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_38")}>
                <div className="grid gap-4 xl:grid-cols-2">
                  {results.map((result) => {
                const bondDefinition = definitions?.[result.type];
                return (<Card key={result.type} className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
                        <CardContent className="space-y-5 p-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getBondColor(result.type) }}/>
                              <p className="text-xl font-black tracking-tight text-slate-950">
                                {result.type}
                              </p>
                            </div>
                            <p className="text-sm leading-7 text-slate-600">
                              {bondDefinition
                        ? bondDefinition.description[language]
                        : getBondSupportMeta(result.type).description}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <ResultMetric label={showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout')} value={formatCurrency(showRealValue
                        ? result.result.finalRealValue
                        : result.result.netPayoutValue)} tone="text-primary"/>
                            <ResultMetric label={t('common.net_profit')} value={formatCurrency(result.result.totalProfit)} tone={result.result.totalProfit >= 0 ? 'text-emerald-700' : 'text-destructive'}/>
                            <ResultMetric label={t('bonds.real_cagr')} value={formatPct(result.result.realAnnualizedReturn)} tone="text-blue-700"/>
                            <ResultMetric label={t('bonds.tax')} value={formatCurrency(result.result.totalTax)} tone="text-orange-700"/>
                          </div>
                        </CardContent>
                      </Card>);
            })}
                </div>
              </SectionBlock>

              <SectionBlock title={t("generated.features.comparison_engine.components.bond_comparison_container.item_39")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_40")}>
                <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
                  <CardContent className="p-4 md:p-6">
                    <ChartSupportNote title={t("generated.features.comparison_engine.components.bond_comparison_container.item_41")} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_42")}/>

                    <ChartContainer height={420}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }}/>
                          <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12 }}/>
                          <Tooltip formatter={(value: ValueType | undefined) => typeof value === 'number'
                ? formatCurrency(value)
                : value ?? '-'}/>
                          <Legend />
                          {selectedBonds.map((bondType) => (<Line key={bondType} type="monotone" dataKey={bondType} name={bondType} stroke={getBondColor(bondType)} strokeWidth={2.5} dot={false}/>))}
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </SectionBlock>

              <SecondaryInsightAccordion title={t('bonds.simulation.calculation_context')} description={t("generated.features.comparison_engine.components.bond_comparison_container.item_43")} badge={t("generated.features.comparison_engine.components.bond_comparison_container.item_44")}>
                <CalculationMetaPanel warnings={envelope?.warnings} assumptions={envelope?.assumptions} calculationNotes={envelope?.calculationNotes} dataQualityFlags={envelope?.dataQualityFlags} dataFreshness={envelope?.dataFreshness}/>
              </SecondaryInsightAccordion>
            </div>) : null}
        </div>
      </div>
      <RecalculateButton isDirty={isDirty} hasResults={results.length > 0} loading={loading} disabled={selectedBonds.length === 0} onClick={calculateComparison}/>
    </div>);
};





