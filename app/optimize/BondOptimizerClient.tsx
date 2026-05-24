'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Info,
  ListOrdered,
  TrendingUp,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BondOptimizerCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { TaxStrategy } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import {
  FAMILY_BOND_TYPES,
  getBondSupportMeta,
} from '@/features/bond-core/support-matrix';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { ScenarioReadyPanel } from '@/shared/components/feedback/ScenarioReadyPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import {
  useCurrencyFormatter,
  usePercentFormatter,
} from '@/shared/hooks/useLocalizedFormatters';
import { toDateString } from '@/shared/lib/date-timing';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';

type OptimizerInputs = {
  initialInvestment: number;
  investmentHorizonMonths: number;
  purchaseDate: string;
  expectedInflation: number;
  expectedNbpRate: number;
  taxStrategy: TaxStrategy;
  includeFamilyBonds: boolean;
};

const DEFAULT_INPUTS: OptimizerInputs = {
  initialInvestment: 10000,
  investmentHorizonMonths: 48,
  purchaseDate: toDateString(new Date()),
  expectedInflation: 3.5,
  expectedNbpRate: 5.25,
  taxStrategy: TaxStrategy.STANDARD,
  includeFamilyBonds: false,
};

const SupportMetric = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) => (
  <Card className="rounded-2xl border shadow-none">
    <CardContent className="p-5">
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </CardContent>
  </Card>
);

export default function BondOptimizerClient() {
  const { t, locale: language } = useAppI18n();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const [inputs, setInputs] = useState<OptimizerInputs>(DEFAULT_INPUTS);
  const [envelope, setEnvelope] =
    useState<BondOptimizerCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const { isCalculating, post } = useCalculationRequest();
  const hasTouchedMacroAssumptions = React.useRef(false);
  const currencyFormatter = useCurrencyFormatter(language, {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  });
  const percentFormatter = usePercentFormatter(language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

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

  const results = envelope?.result;
  const leadingScenario = results?.highestPayout;
  const horizonYears = useMemo(
    () => (inputs.investmentHorizonMonths / 12).toFixed(1),
    [inputs.investmentHorizonMonths],
  );
  const formatCurrency = React.useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter],
  );
  const formatPercentValue = React.useCallback(
    (value: number) => percentFormatter.format(value / 100),
    [percentFormatter],
  );
  const taxStrategyLabels: Record<TaxStrategy, string> = useMemo(
    () => ({
      [TaxStrategy.STANDARD]: t('optimizer_page.tax_strategies.standard'),
      [TaxStrategy.IKE]: t('optimizer_page.tax_strategies.ike'),
      [TaxStrategy.IKZE]: t('optimizer_page.tax_strategies.ikze'),
    }),
    [t],
  );

  const updateInput = (
    key: keyof OptimizerInputs,
    value: string | number | boolean,
  ) => {
    if (key === 'expectedInflation' || key === 'expectedNbpRate') {
      hasTouchedMacroAssumptions.current = true;
    }
    setInputs((prev) => ({ ...prev, [key]: value as never }));
    setIsDirty(true);
  };

  const handleCalculate = async () => {
    try {
      const data = await post<BondOptimizerCalculationEnvelope>(
        '/api/calculate/optimize',
        inputs,
      );
      setEnvelope(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Scenario ranking error:', error);
    }
  };

  return (
    <CalculatorPageShell
      title={t('optimizer_page.page_title')}
      description={t('optimizer_page.page_description')}
      icon={<TrendingUp className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={!!results}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4">
            <Card className="rounded-2xl border-2 shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-black uppercase tracking-widest">
                {t('optimizer_page.input_title')}
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                {t('optimizer_page.input_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('optimizer_page.amount_label')}
                  </Label>
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrency(inputs.initialInvestment)}
                  </span>
                </div>
                <CommittedSliderInput
                  value={inputs.initialInvestment}
                  min={100}
                  max={250000}
                  step={100}
                  unit="PLN"
                  onCommit={(value) =>
                    updateInput('initialInvestment', value)
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('optimizer_page.horizon_label')}
                  </Label>
                  <span className="text-lg font-semibold text-foreground">
                    {t('optimizer_page.horizon_value', {
                      months: String(inputs.investmentHorizonMonths),
                      years: horizonYears,
                    })}
                  </span>
                </div>
                <CommittedSliderInput
                  value={inputs.investmentHorizonMonths}
                  min={3}
                  max={360}
                  step={1}
                  unit="M"
                  onCommit={(value) =>
                    updateInput('investmentHorizonMonths', value)
                  }
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="purchaseDate"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t('optimizer_page.purchase_date_label')}
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={inputs.purchaseDate}
                  onChange={(event) =>
                    updateInput('purchaseDate', event.target.value)
                  }
                  className="rounded-xl"
                />
              </div>

              <Accordion type="single" collapsible defaultValue="">
                <AccordionItem value="advanced" className="border-none">
                  <AccordionTrigger className="rounded-2xl border bg-slate-50 px-4 py-4 hover:no-underline">
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-bold text-slate-950">
                        {t('optimizer_page.advanced_title')}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {t('optimizer_page.advanced_description')}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-5 px-1 pt-4">
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('optimizer_page.tax_strategy_label')}
                      </Label>
                      <Select
                        value={inputs.taxStrategy}
                        onValueChange={(value) =>
                          updateInput('taxStrategy', value)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder={t('optimizer_page.select_strategy')} />
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

                    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label
                          htmlFor="includeFamilyBonds"
                          className="flex flex-col gap-1"
                        >
                          <span className="font-medium text-foreground">
                            {t('optimizer_page.family_bonds_title')}
                          </span>
                          <span className="text-sm font-normal leading-6 text-muted-foreground">
                            {t('optimizer_page.family_bonds_description')}
                          </span>
                        </Label>
                        <Switch
                          id="includeFamilyBonds"
                          checked={inputs.includeFamilyBonds}
                          onCheckedChange={(value) =>
                            updateInput('includeFamilyBonds', value)
                          }
                        />
                      </div>
                      <p className="text-xs leading-6 text-amber-950">
                        {t('optimizer_page.family_bonds_note', {
                          bonds: FAMILY_BOND_TYPES.join(' / '),
                          support: getBondSupportMeta(FAMILY_BOND_TYPES[0]).shortLabel.toLowerCase(),
                        })}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('optimizer_page.expected_inflation_label')}
                        </Label>
                        <span className="text-lg font-semibold text-foreground">
                          {inputs.expectedInflation.toFixed(1)}%
                        </span>
                      </div>
                      <CommittedSliderInput
                        value={inputs.expectedInflation}
                        min={-2}
                        max={15}
                        step={0.1}
                        unit="%"
                        onCommit={(value) =>
                          updateInput('expectedInflation', value)
                        }
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('optimizer_page.expected_nbp_label')}
                        </Label>
                        <span className="text-lg font-semibold text-foreground">
                          {inputs.expectedNbpRate.toFixed(2)}%
                        </span>
                      </div>
                      <CommittedSliderInput
                        value={inputs.expectedNbpRate}
                        min={0}
                        max={15}
                        step={0.05}
                        unit="%"
                        onCommit={(value) =>
                          updateInput('expectedNbpRate', value)
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                {t('optimizer_page.input_footer')}
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-6 xl:col-span-8">
          {results && leadingScenario ? (
            <>
              {isDirty ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                  {t('optimizer_page.stale_results')}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupportMetric
                  label={t('optimizer_page.metrics.leading_payout_label')}
                  value={formatCurrency(leadingScenario.netPayoutValue)}
                  detail={t('optimizer_page.metrics.leading_payout_detail', {
                    years: horizonYears,
                  })}
                />
                <SupportMetric
                  label={t('optimizer_page.metrics.leading_bond_label')}
                  value={`${leadingScenario.bondType}`}
                  detail={leadingScenario.name}
                />
                <SupportMetric
                  label={t('optimizer_page.metrics.net_profit_label')}
                  value={`+${formatCurrency(leadingScenario.totalProfit)}`}
                  detail={t('optimizer_page.metrics.net_profit_detail')}
                />
                <SupportMetric
                  label={t('optimizer_page.metrics.roi_label')}
                  value={formatPercentValue(
                    (leadingScenario.totalProfit / inputs.initialInvestment) *
                      100,
                  )}
                  detail={t('optimizer_page.metrics.roi_detail')}
                />
              </div>

              <Card className="rounded-2xl border shadow-none">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <ListOrdered className="h-5 w-5 text-primary" />
                        {t('optimizer_page.leading_card_title')}
                      </CardTitle>
                      <CardDescription className="text-sm leading-6">
                        {t('optimizer_page.leading_card_description')}
                      </CardDescription>
                    </div>
                    <div className="rounded-xl border bg-muted/20 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('optimizer_page.tax_wrapper_label')}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {taxStrategyLabels[inputs.taxStrategy]}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">
                      {leadingScenario.name} ({leadingScenario.bondType})
                    </p>
                    <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                      <Info className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{leadingScenario.scenarioReason}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('optimizer_page.tax_paid_label')}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-orange-700">
                        {formatCurrency(leadingScenario.result.totalTax)}
                      </p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('optimizer_page.inflation_input_label')}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {inputs.expectedInflation.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('optimizer_page.nbp_input_label')}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {inputs.expectedNbpRate.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-none">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ArrowDownUp className="h-5 w-5 text-primary" />
                    {t('optimizer_page.ranked_outcomes_title')}
                  </CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {t('optimizer_page.ranked_outcomes_description', {
                      years: horizonYears,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {results.rankedBonds.map((item, index) => {
                    const gapToLead =
                      leadingScenario.netPayoutValue - item.netPayoutValue;

                    return (
                      <div
                        key={item.bondType}
                        className="rounded-2xl border p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted/20 text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">
                                {item.name} ({item.bondType})
                              </p>
                              <p className="text-sm leading-6 text-muted-foreground">
                                {item.scenarioReason}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">
                              {formatCurrency(item.netPayoutValue)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {index === 0
                                ? t('optimizer_page.leading_gap_primary')
                                : t('optimizer_page.leading_gap_secondary', {
                                    gap: formatCurrency(gapToLead),
                                  })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <SecondaryInsightAccordion
                title={t('optimizer_page.guardrail_title')}
                description={t('optimizer_page.guardrail_description')}
                badge={t('optimizer_page.guardrail_badge')}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    {t('optimizer_page.guardrail_points.assumption_shift')}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    {t('optimizer_page.guardrail_points.suitability')}
                  </div>
                </div>
              </SecondaryInsightAccordion>

              <SecondaryInsightAccordion
                title={t('optimizer_page.audit_title')}
                description={t('optimizer_page.audit_description')}
                badge={t('optimizer_page.audit_badge')}
              >
                <CalculationMetaPanel
                  warnings={envelope?.warnings}
                  assumptions={envelope?.assumptions}
                  calculationNotes={envelope?.calculationNotes}
                  dataQualityFlags={envelope?.dataQualityFlags}
                  dataFreshness={envelope?.dataFreshness}
                />
              </SecondaryInsightAccordion>
            </>
          ) : (
            <ScenarioReadyPanel
              badge={t('optimizer_page.ready_badge')}
              title={t('optimizer_page.ready_title')}
              description={t('optimizer_page.ready_description')}
                steps={[
                  {
                    id: 'amount',
                    title: t('optimizer_page.ready_steps.amount.title'),
                    description: t('optimizer_page.ready_steps.amount.description', {
                      amount: formatCurrency(inputs.initialInvestment),
                    }),
                  },
                  {
                    id: 'horizon',
                    title: t('optimizer_page.ready_steps.horizon.title'),
                    description: t('optimizer_page.ready_steps.horizon.description', {
                      months: String(inputs.investmentHorizonMonths),
                    }),
                  },
                  {
                    id: 'narrow-scope',
                    title: t('optimizer_page.ready_steps.scope.title'),
                    description: t('optimizer_page.ready_steps.scope.description'),
                  },
              ]}
              footerText={t('optimizer_page.ready_footer')}
            />
          )}
        </section>
      </div>

      <RecalculateButton
        isDirty={isDirty}
        loading={isCalculating}
        hasResults={!!results}
        onClick={handleCalculate}
      />
    </CalculatorPageShell>
  );
}
