'use client';
import React, { useMemo, useState } from 'react';
import { Calendar, LineChart, Wallet, } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { getBondSupportMeta, getRetirementSupportNote, RETIREMENT_SUPPORTED_BOND_TYPES, supportsRetirementBondType, } from '@/features/bond-core/support-matrix';
import { RetirementPlannerCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { ScenarioReadyPanel } from '@/shared/components/ScenarioReadyPanel';
import { SecondaryInsightAccordion } from '@/shared/components/SecondaryInsightAccordion';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { formatHorizonMonths } from '@/shared/lib/format-horizon';
import { formatCurrency } from '@/lib/utils';
import { useAppI18n } from '@/i18n/client';
function formatRate(value: number) {
    return `${value.toFixed(2)}%`;
}
type RetirementInputs = {
    initialCapital: number;
    monthlyWithdrawal: number;
    expectedInflation: number;
    expectedNbpRate: number;
    bondType: BondType;
    taxStrategy: TaxStrategy;
    horizonYears: number;
};
const DEFAULT_INPUTS: RetirementInputs = {
    initialCapital: 500000,
    monthlyWithdrawal: 3000,
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    bondType: BondType.EDO,
    taxStrategy: TaxStrategy.STANDARD,
    horizonYears: 25,
};
const SummaryMetric = ({ label, value, detail, tone = 'default', }: {
    label: string;
    value: string;
    detail: string;
    tone?: 'default' | 'success' | 'warning';
}) => {
    const toneClass = tone === 'success'
        ? 'border-emerald-200 bg-emerald-50/70'
        : tone === 'warning'
            ? 'border-amber-200 bg-amber-50/80'
            : 'border-slate-200 bg-white';
    return (<Card className={toneClass}>
      <CardContent className="p-5">
        <p className="text-[10px] font-black uppercase text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>);
};
const SupportList = ({ title, items, emptyLabel, }: {
    title: string;
    items: string[];
    emptyLabel: string;
}) => (<Card className="rounded-2xl border shadow-none">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
      {items.length === 0 ? (<p>{emptyLabel}</p>) : (items.map((item) => (<div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            {item}
          </div>)))}
    </CardContent>
  </Card>);
export const RetirementPlannerContainer: React.FC = () => {
    const { t, locale: language } = useAppI18n();
    const { isCalculating, post } = useCalculationRequest();
    const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_INPUTS);
    const [isDirty, setIsDirty] = useState(true);
    const [results, setResults] = useState<RetirementPlannerCalculationEnvelope | null>(null);
    const handleCalculate = async () => {
        const bondType = supportsRetirementBondType(inputs.bondType)
            ? inputs.bondType
            : BondType.EDO;
        const response = await post<RetirementPlannerCalculationEnvelope>('/api/calculate/retirement', {
            ...inputs,
            bondType,
        });
        setResults(response);
        setIsDirty(false);
    };
    const chartData = useMemo(() => results?.result.timeline
        .filter((_, index) => index % 12 === 0)
        .map((point) => ({
        year: point.year,
        date: point.date,
        balance: point.balance,
        withdrawal: point.withdrawal,
    })) ?? [], [results]);
    const scenarioCoverage = useMemo(() => {
        if (!results) {
            return null;
        }
        const finalMonth = results.result.timeline[results.result.timeline.length - 1];
        if (!finalMonth) {
            return null;
        }
        return formatHorizonMonths((finalMonth.year * 12) + finalMonth.month, language);
    }, [language, results]);
    const labels = {
        pageTitle: t("generated.features.retirement.components.retirement_planner_container.item_1"),
        pageDescription: t("generated.features.retirement.components.retirement_planner_container.item_2"),
        primaryInputs: t("generated.features.retirement.components.retirement_planner_container.item_3"),
        primaryInputsDesc: t("generated.features.retirement.components.retirement_planner_container.item_4"),
        initialCapital: t("generated.features.retirement.components.retirement_planner_container.item_5"),
        monthlyWithdrawal: t("generated.features.retirement.components.retirement_planner_container.item_6"),
        scenarioHorizon: t("generated.features.retirement.components.retirement_planner_container.item_7"),
        bondFamily: t("generated.features.retirement.components.retirement_planner_container.item_8"),
        advancedAssumptions: t("generated.features.retirement.components.retirement_planner_container.item_9"),
        advancedAssumptionsDesc: t("generated.features.retirement.components.retirement_planner_container.item_10"),
        expectedInflation: t("generated.features.retirement.components.retirement_planner_container.item_11"),
        expectedNbpRate: t("generated.features.retirement.components.retirement_planner_container.item_12"),
        taxWrapper: t("generated.features.retirement.components.retirement_planner_container.item_13"),
        floatingActionNote: t("generated.features.retirement.components.retirement_planner_container.item_14"),
        staleResults: t("generated.features.retirement.components.retirement_planner_container.item_15"),
        scenarioStatus: t("generated.features.retirement.components.retirement_planner_container.item_16"),
        balancePositive: t("generated.features.retirement.components.retirement_planner_container.item_17"),
        balanceDepletes: t("generated.features.retirement.components.retirement_planner_container.item_18"),
        projectedExhaustion: t("generated.features.retirement.components.retirement_planner_container.item_19"),
        noProjectedDepletion: t("generated.features.retirement.components.retirement_planner_container.item_20"),
        finalBalance: t("generated.features.retirement.components.retirement_planner_container.item_21"),
        finalBalanceDetail: t("generated.features.retirement.components.retirement_planner_container.item_22"),
        totalWithdrawn: t("generated.features.retirement.components.retirement_planner_container.item_23"),
        totalWithdrawnDetail: t("generated.features.retirement.components.retirement_planner_container.item_24"),
        modeledAnnualRate: t("generated.features.retirement.components.retirement_planner_container.item_25"),
        modeledAnnualRateDetail: t("generated.features.retirement.components.retirement_planner_container.item_26"),
        balancePath: t("generated.features.retirement.components.retirement_planner_container.item_27"),
        balancePathDesc: t("generated.features.retirement.components.retirement_planner_container.item_28"),
        coverage: t("generated.features.retirement.components.retirement_planner_container.item_29"),
        taxPaid: t("generated.features.retirement.components.retirement_planner_container.item_30"),
        howToRead: t("generated.features.retirement.components.retirement_planner_container.item_31"),
        howToReadDesc: t("generated.features.retirement.components.retirement_planner_container.item_32"),
        balance: t("generated.features.retirement.components.retirement_planner_container.item_33"),
        withdrawal: t("generated.features.retirement.components.retirement_planner_container.item_34"),
        assumptionsAndWarnings: t("generated.features.retirement.components.retirement_planner_container.item_35"),
        assumptionsAndWarningsDesc: t("generated.features.retirement.components.retirement_planner_container.item_36"),
        audit: t("generated.features.retirement.components.retirement_planner_container.item_37"),
        assumptions: t("generated.features.retirement.components.retirement_planner_container.item_38"),
        warningsAndNotes: t("generated.features.retirement.components.retirement_planner_container.item_39"),
        noExtraAssumptions: t("generated.features.retirement.components.retirement_planner_container.item_40"),
        noExtraWarnings: t("generated.features.retirement.components.retirement_planner_container.item_41"),
        readyBadge: t("generated.features.retirement.components.retirement_planner_container.item_42"),
        readyTitle: t("generated.features.retirement.components.retirement_planner_container.item_43"),
        readyDesc: t("generated.features.retirement.components.retirement_planner_container.item_44"),
        readyStepBalance: t("generated.features.retirement.components.retirement_planner_container.item_45"),
        readyStepHorizon: t("generated.features.retirement.components.retirement_planner_container.item_46"),
        readyStepRead: t("generated.features.retirement.components.retirement_planner_container.item_47"),
        readyStepReadDesc: t("generated.features.retirement.components.retirement_planner_container.item_48"),
        readyFooter: t("generated.features.retirement.components.retirement_planner_container.item_49"),
        limitsTitle: t("generated.features.retirement.components.retirement_planner_container.item_50"),
        limitsDesc: t("generated.features.retirement.components.retirement_planner_container.item_51"),
        limitsBadge: t("generated.features.retirement.components.retirement_planner_container.item_52"),
        depletionWarning: t("generated.features.retirement.components.retirement_planner_container.item_53"),
    } as const;
    const taxStrategyLabels: Record<TaxStrategy, string> = {
        [TaxStrategy.STANDARD]: t("generated.features.retirement.components.retirement_planner_container.item_54"),
        [TaxStrategy.IKE]: t("generated.features.retirement.components.retirement_planner_container.item_55"),
        [TaxStrategy.IKZE]: t("generated.features.retirement.components.retirement_planner_container.item_56"),
    };
    const modelLimits = [
        t("generated.features.retirement.components.retirement_planner_container.item_57"),
        t('retirement.supported_bonds_limit', {
            bondTypes: RETIREMENT_SUPPORTED_BOND_TYPES.join(', '),
        }),
        t("generated.features.retirement.components.retirement_planner_container.item_58"),
    ];
    const updateInput = <K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]) => {
        setInputs((prev) => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };
    return (<CalculatorPageShell title={labels.pageTitle} description={labels.pageDescription} icon={<Wallet className="h-8 w-8"/>} isCalculating={isCalculating} isDirty={isDirty} hasResults={!!results}>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4">
          <Card className="rounded-2xl border-2">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-black uppercase tracking-widest">
                {labels.primaryInputs}
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {labels.primaryInputsDesc}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                    {labels.initialCapital}
                </Label>
                <Input type="number" value={inputs.initialCapital} onChange={(event) => updateInput('initialCapital', Number(event.target.value))} className="rounded-xl font-bold"/>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    {labels.monthlyWithdrawal}
                  </Label>
                  <span className="text-xs font-black text-primary">
                    {formatCurrency(inputs.monthlyWithdrawal)}
                  </span>
                </div>
                <CommittedSliderInput value={inputs.monthlyWithdrawal} min={500} max={20000} step={100} unit="PLN" onCommit={(value) => updateInput('monthlyWithdrawal', value)}/>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    {labels.scenarioHorizon}
                  </Label>
                  <span className="text-xs font-black text-primary">
                    {formatHorizonMonths(inputs.horizonYears * 12, language)}
                  </span>
                </div>
                <CommittedSliderInput value={inputs.horizonYears} min={1} max={50} step={1} unit="Y" onCommit={(value) => updateInput('horizonYears', value)}/>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                    {labels.bondFamily}
                </Label>
                <Select value={inputs.bondType} onValueChange={(value) => updateInput('bondType', value as BondType)}>
                  <SelectTrigger className="rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETIREMENT_SUPPORTED_BOND_TYPES.map((type) => (<SelectItem key={type} value={type}>
                        <div className="flex flex-col">
                          <span>{type}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {getBondSupportMeta(type).shortLabel}
                          </span>
                        </div>
                      </SelectItem>))}
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">
                  {getRetirementSupportNote(inputs.bondType)}
                </p>
              </div>

              <Accordion type="single" collapsible defaultValue="">
                <AccordionItem value="advanced" className="border-none">
                  <AccordionTrigger className="rounded-2xl border bg-slate-50 px-4 py-4 hover:no-underline">
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-bold text-slate-950">
                        {labels.advancedAssumptions}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {labels.advancedAssumptionsDesc}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-5 px-1 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          {labels.expectedInflation}
                        </Label>
                        <span className="text-xs font-black text-primary">
                          {formatRate(inputs.expectedInflation)}
                        </span>
                      </div>
                      <CommittedSliderInput value={inputs.expectedInflation} min={-2} max={15} step={0.1} unit="%" onCommit={(value) => updateInput('expectedInflation', value)}/>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">
                          {labels.expectedNbpRate}
                        </Label>
                        <span className="text-xs font-black text-primary">
                          {formatRate(inputs.expectedNbpRate)}
                        </span>
                      </div>
                      <CommittedSliderInput value={inputs.expectedNbpRate} min={0} max={15} step={0.05} unit="%" onCommit={(value) => updateInput('expectedNbpRate', value)}/>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        {labels.taxWrapper}
                      </Label>
                      <Select value={inputs.taxStrategy} onValueChange={(value) => updateInput('taxStrategy', value as TaxStrategy)}>
                        <SelectTrigger className="rounded-xl font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TaxStrategy.STANDARD}>
                            {taxStrategyLabels[TaxStrategy.STANDARD]}
                          </SelectItem>
                          <SelectItem value={TaxStrategy.IKE}>
                            {taxStrategyLabels[TaxStrategy.IKE]}
                          </SelectItem>
                          <SelectItem value={TaxStrategy.IKZE}>
                            {taxStrategyLabels[TaxStrategy.IKZE]}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                {labels.floatingActionNote}
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-8 xl:col-span-8">
          {results ? (<>
              {isDirty ? (<div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                  {labels.staleResults}
                </div>) : null}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <SummaryMetric label={labels.scenarioStatus} value={results.result.isSustainable
                ? labels.balancePositive
                : labels.balanceDepletes} detail={results.result.exhaustionDate
                ? `${labels.projectedExhaustion}: ${results.result.exhaustionDate}`
                : labels.noProjectedDepletion} tone={results.result.isSustainable ? 'success' : 'warning'}/>
                <SummaryMetric label={labels.finalBalance} value={formatCurrency(results.result.finalBalance)} detail={labels.finalBalanceDetail}/>
                <SummaryMetric label={labels.totalWithdrawn} value={formatCurrency(results.result.totalWithdrawn)} detail={labels.totalWithdrawnDetail}/>
                <SummaryMetric label={labels.modeledAnnualRate} value={formatRate(results.result.modeledAnnualRate)} detail={labels.modeledAnnualRateDetail.replace('{{bond}}', results.result.modeledBondType)}/>
              </div>

              <Card className="rounded-2xl border-2 shadow-none">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
                    <LineChart className="h-5 w-5 text-primary"/>
                    {labels.balancePath}
                  </CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {labels.balancePathDesc}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase text-slate-600">
                        {labels.coverage}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {scenarioCoverage ?? formatHorizonMonths(inputs.horizonYears * 12, language)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase text-slate-600">
                        {labels.taxWrapper}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {taxStrategyLabels[inputs.taxStrategy]}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase text-slate-600">
                        {labels.taxPaid}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {formatCurrency(results.result.totalTaxPaid)}
                      </p>
                    </div>
                  </div>

                  <ChartSupportNote title={labels.howToRead} description={labels.howToReadDesc}/>

                  <ChartContainer height={400}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="retirement-balance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1}/>
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }}/>
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}/>
                        <Tooltip contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            }} formatter={(value, key) => [
                formatCurrency(Number(value || 0)),
                key === 'balance' ? labels.balance : labels.withdrawal,
            ]}/>
                        <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#retirement-balance)"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <SecondaryInsightAccordion title={labels.assumptionsAndWarnings} description={labels.assumptionsAndWarningsDesc} badge={labels.audit}>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <SupportList title={labels.assumptions} items={results.assumptions} emptyLabel={labels.noExtraAssumptions}/>
                  <SupportList title={labels.warningsAndNotes} items={[
                ...results.warnings,
                ...results.calculationNotes,
                ...results.dataQualityFlags,
            ]} emptyLabel={labels.noExtraWarnings}/>
                </div>
              </SecondaryInsightAccordion>
            </>) : (<ScenarioReadyPanel badge={labels.readyBadge} title={labels.readyTitle} description={labels.readyDesc} steps={[
                {
                    id: 'balance-path',
                    title: labels.readyStepBalance,
                    description: t('retirement.ready_step_balance_desc', {
                        initialCapital: formatCurrency(inputs.initialCapital),
                    }),
                },
                {
                    id: 'horizon',
                    title: labels.readyStepHorizon,
                    description: t('retirement.ready_step_horizon_desc', {
                        horizon: formatHorizonMonths(inputs.horizonYears * 12, language),
                    }),
                },
                {
                    id: 'narrow-read',
                    title: labels.readyStepRead,
                    description: labels.readyStepReadDesc,
                },
            ]} footerText={labels.readyFooter}/>)}

          <SecondaryInsightAccordion title={labels.limitsTitle} description={labels.limitsDesc} badge={labels.limitsBadge}>
            <div className="grid grid-cols-1 gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
              {modelLimits.map((item) => (<div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {item}
                </div>))}
            </div>
          </SecondaryInsightAccordion>

          {results?.result.exhaustionDate ? (<div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"/>
              <p>
                {labels.depletionWarning.replace('{{date}}', results.result.exhaustionDate)}
              </p>
            </div>) : null}
        </div>
      </div>

      <RecalculateButton isDirty={isDirty} loading={isCalculating} hasResults={!!results} onClick={handleCalculate}/>
    </CalculatorPageShell>);
};





