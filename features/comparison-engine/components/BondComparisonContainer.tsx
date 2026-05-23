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
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { ReadingChecklist } from '@/shared/components/insights/ReadingChecklist';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';
import { sampleSeriesPoints } from '@/shared/lib/chart-series';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getIntlLocale } from '@/i18n/locale-utils';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
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
    const { defaults: macroDefaults } = useMacroAssumptionDefaults();
    const [initialInvestment, setInitialInvestment] = useState(10000);
    const [expectedInflation, setExpectedInflation] = useState(3.5);
    const [expectedNbpRate, setExpectedNbpRate] = useState(5.25);
    const [customInflation, setCustomInflation] = useState<number[] | undefined>(undefined);
    const [customNbpRate, setCustomNbpRate] = useState<number[] | undefined>(undefined);
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
    const hasTouchedMacroAssumptions = React.useRef(false);
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
    useEffect(() => {
        if (!customNbpRate) {
            return;
        }
        const nextLength = Math.max(1, Math.round(duration));
        if (customNbpRate.length === nextLength) {
            return;
        }
        setCustomNbpRate(Array.from({ length: nextLength }, (_, index) => customNbpRate[index] ?? expectedNbpRate));
    }, [customNbpRate, duration, expectedNbpRate]);
    useEffect(() => {
        if (!macroDefaults || hasTouchedMacroAssumptions.current) {
            return;
        }
        setExpectedInflation(macroDefaults.expectedInflation);
        setExpectedNbpRate(macroDefaults.expectedNbpRate);
    }, [macroDefaults]);
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
                    customNbpRate,
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
        hasTouchedMacroAssumptions.current = true;
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
        if (key === 'customNbpRate') {
            const nextPath = value as number[] | undefined;
            setCustomNbpRate(nextPath
                ? Array.from({ length: Math.max(1, Math.round(duration)) }, (_, index) => nextPath[index] ?? expectedNbpRate)
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
        t('comparison.page.reading_guide.understand_assumptions'),
        t('comparison.page.reading_guide.compare_payout'),
        t('comparison.page.reading_guide.check_real_value'),
    ];
    return (<div className="space-y-6 pb-20 md:space-y-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-8">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
            <CardHeader className="space-y-3 border-b border-slate-200 pb-5">
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
                <Scale className="h-5 w-5 text-primary"/>
                {t('comparison.page.configuration_title')}
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-slate-600">
                {t('comparison.page.configuration_description')}
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-6 p-5 md:p-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t('comparison.page.initial_investment')}
                </Label>
                <CommittedSliderInput value={initialInvestment} min={1000} max={100000} step={100} unit="PLN" onCommit={(value) => {
            setInitialInvestment(value);
            setIsDirty(true);
        }}/>
              </div>

              <div className="space-y-2 border-t border-dashed border-slate-200 pt-5">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {t('comparison.page.investment_horizon')}
                </Label>
                <CommittedSliderInput value={duration} min={1} max={30} step={1} unit={t('common.years')} onCommit={(value) => {
            setDuration(value);
            setIsDirty(true);
        }}/>
              </div>

              <div className="space-y-4 border-t border-dashed border-slate-200 pt-5">
                <MarketAssumptionsForm expectedInflation={expectedInflation} expectedNbpRate={expectedNbpRate} customInflation={customInflation} customNbpRate={customNbpRate} inflationScenario={inflationScenario} bondType={selectedBonds.includes(BondType.ROR) ||
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
                      {t('comparison.page.real_value_toggle_description')}
                    </p>
                  </div>
                  <Switch checked={showRealValue} onCheckedChange={setShowRealValue}/>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {t('comparison.page.rollover_title')}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-slate-600">
                    {t('comparison.page.rollover_description')}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
            <CardHeader className="space-y-3 border-b border-slate-200 pb-5">
              <CardTitle className="text-lg font-black tracking-tight text-slate-950">
                {t('comparison.page.bond_picker_title')}
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-slate-600">
                {t('comparison.page.bond_picker_description')}
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

          <SecondaryInsightAccordion title={t('comparison.page.how_to_read_title')} description={t('comparison.page.how_to_read_description')} badge={t('comparison.page.how_to_read_badge')}>
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2 font-black tracking-tight text-slate-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600"/>
                  {t('comparison.page.reading_checklist_title')}
                </div>
                <div className="mt-3">
                  <ReadingChecklist items={comparisonReadingGuide}/>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <StepCard title={t('comparison.page.steps.configure_title')} description={t('comparison.page.steps.configure_description')}/>
                <StepCard title={t('comparison.page.steps.run_title')} description={t('comparison.page.steps.run_description')}/>
                <StepCard title={t('comparison.page.steps.decide_title')} description={t('comparison.page.steps.decide_description')}/>
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
                    {t('comparison.page.empty_state_title')}
                  </h3>
                  <p className="max-w-3xl text-sm leading-8 text-slate-600">
                    {t('comparison.page.empty_state_description')}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <StepCard title={t('comparison.page.empty_steps.choose_bonds_title')} description={t('comparison.page.empty_steps.choose_bonds_description')}/>
                  <StepCard title={t('comparison.page.empty_steps.set_assumptions_title')} description={t('comparison.page.empty_steps.set_assumptions_description')}/>
                  <StepCard title={t('comparison.page.empty_steps.run_title')} description={t('comparison.page.empty_steps.run_description')}/>
                </div>

              </CardContent>
            </Card>) : null}

          {loading && !results.length ? (<div className="flex h-[420px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
              <Loader2 className="h-10 w-10 animate-spin text-primary"/>
            </div>) : null}

          {results.length ? (<div className="space-y-10">
              {isDirty ? (<div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                  {t('comparison.page.stale_results')}
                </div>) : null}

              <SectionBlock title={t('comparison.page.summary_title')} description={t('comparison.page.summary_description')}>
                <div className="grid gap-4 lg:grid-cols-3">
                  <ResultMetric label={t('comparison.page.best_match')} value={bestResult ? bestResult.type : '-'}/>
                  <ResultMetric label={showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout')} value={bestResult
                ? formatCurrency(showRealValue
                    ? bestResult.result.finalRealValue
                    : bestResult.result.netPayoutValue)
                : '-'} tone="text-emerald-700"/>
                  <ResultMetric label={t('comparison.page.scenarios_modeled')} value={String(results.length)}/>
                </div>
              </SectionBlock>

              <SectionBlock title={t('comparison.page.results_title')} description={t('comparison.page.results_description')}>
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

              <SectionBlock title={t('comparison.page.chart_title')} description={t('comparison.page.chart_description')}>
                <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
                  <CardContent className="p-4 md:p-6">
                    <ChartSupportNote title={t('comparison.page.chart_note_title')} description={t('comparison.page.chart_note_description')}/>

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

              <SecondaryInsightAccordion title={t('bonds.simulation.calculation_context')} description={t('comparison.page.calculation_context_description')} badge={t('comparison.page.calculation_context_badge')}>
                <CalculationMetaPanel warnings={envelope?.warnings} assumptions={envelope?.assumptions} calculationNotes={envelope?.calculationNotes} dataQualityFlags={envelope?.dataQualityFlags} dataFreshness={envelope?.dataFreshness}/>
              </SecondaryInsightAccordion>
            </div>) : null}
        </div>
      </div>
      <RecalculateButton isDirty={isDirty} hasResults={results.length > 0} loading={loading} disabled={selectedBonds.length === 0} onClick={calculateComparison}/>
    </div>);
};





