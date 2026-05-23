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
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
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
    const { defaults: macroDefaults } = useMacroAssumptionDefaults();
    const { isCalculating, post } = useCalculationRequest();
    const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_INPUTS);
    const [isDirty, setIsDirty] = useState(true);
    const [results, setResults] = useState<RetirementPlannerCalculationEnvelope | null>(null);
    const hasTouchedMacroAssumptions = React.useRef(false);
    React.useEffect(() => {
        if (!macroDefaults || hasTouchedMacroAssumptions.current) {
            return;
        }
        setInputs((previous) => ({
            ...previous,
            expectedInflation: macroDefaults.expectedInflation,
            expectedNbpRate: macroDefaults.expectedNbpRate,
        }));
    }, [macroDefaults]);
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
        pageTitle: t('retirement_page.page_title'),
        pageDescription: t('retirement_page.page_description'),
        primaryInputs: t('retirement_page.primary_inputs'),
        primaryInputsDesc: t('retirement_page.primary_inputs_description'),
        initialCapital: t('retirement_page.initial_capital'),
        monthlyWithdrawal: t('retirement_page.monthly_withdrawal'),
        scenarioHorizon: t('retirement_page.scenario_horizon'),
        bondFamily: t('retirement_page.bond_family'),
        advancedAssumptions: t('retirement_page.advanced_assumptions'),
        advancedAssumptionsDesc: t('retirement_page.advanced_assumptions_description'),
        expectedInflation: t('retirement_page.expected_inflation'),
        expectedNbpRate: t('retirement_page.expected_nbp_rate'),
        taxWrapper: t('retirement_page.tax_wrapper'),
        floatingActionNote: t('retirement_page.floating_action_note'),
        staleResults: t('retirement_page.stale_results'),
        scenarioStatus: t('retirement_page.scenario_status'),
        balancePositive: t('retirement_page.balance_positive'),
        balanceDepletes: t('retirement_page.balance_depletes'),
        projectedExhaustion: t('retirement_page.projected_exhaustion'),
        noProjectedDepletion: t('retirement_page.no_projected_depletion'),
        finalBalance: t('retirement_page.final_balance'),
        finalBalanceDetail: t('retirement_page.final_balance_detail'),
        totalWithdrawn: t('retirement_page.total_withdrawn'),
        totalWithdrawnDetail: t('retirement_page.total_withdrawn_detail'),
        modeledAnnualRate: t('retirement_page.modeled_annual_rate'),
        modeledAnnualRateDetail: t('retirement_page.modeled_annual_rate_detail'),
        balancePath: t('retirement_page.balance_path'),
        balancePathDesc: t('retirement_page.balance_path_description'),
        coverage: t('retirement_page.coverage'),
        taxPaid: t('retirement_page.tax_paid'),
        howToRead: t('retirement_page.how_to_read'),
        howToReadDesc: t('retirement_page.how_to_read_description'),
        balance: t('retirement_page.balance'),
        withdrawal: t('retirement_page.withdrawal'),
        assumptionsAndWarnings: t('retirement_page.assumptions_and_warnings'),
        assumptionsAndWarningsDesc: t('retirement_page.assumptions_and_warnings_description'),
        audit: t('retirement_page.audit'),
        assumptions: t('retirement_page.assumptions'),
        warningsAndNotes: t('retirement_page.warnings_and_notes'),
        noExtraAssumptions: t('retirement_page.no_extra_assumptions'),
        noExtraWarnings: t('retirement_page.no_extra_warnings'),
        readyBadge: t('retirement_page.ready_badge'),
        readyTitle: t('retirement_page.ready_title'),
        readyDesc: t('retirement_page.ready_description'),
        readyStepBalance: t('retirement_page.ready_steps.balance_path'),
        readyStepHorizon: t('retirement_page.ready_steps.commit_horizon'),
        readyStepRead: t('retirement_page.ready_steps.read_narrowly'),
        readyStepReadDesc: t('retirement_page.ready_steps.read_narrowly_description'),
        readyFooter: t('retirement_page.ready_footer'),
        limitsTitle: t('retirement_page.limits_title'),
        limitsDesc: t('retirement_page.limits_description'),
        limitsBadge: t('retirement_page.limits_badge'),
        depletionWarning: t('retirement_page.depletion_warning'),
    } as const;
    const taxStrategyLabels: Record<TaxStrategy, string> = {
        [TaxStrategy.STANDARD]: t('retirement_page.tax_strategy.standard'),
        [TaxStrategy.IKE]: t('retirement_page.tax_strategy.ike'),
        [TaxStrategy.IKZE]: t('retirement_page.tax_strategy.ikze'),
    };
    const modelLimits = [
        t('retirement_page.model_limits.steady_rate'),
        t('retirement.supported_bonds_limit', {
            bondTypes: RETIREMENT_SUPPORTED_BOND_TYPES.join(', '),
        }),
        t('retirement_page.model_limits.scope'),
    ];
    const updateInput = <K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]) => {
        if (key === 'expectedInflation' || key === 'expectedNbpRate') {
            hasTouchedMacroAssumptions.current = true;
        }
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





