'use client';
import { Wallet } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import {
  RETIREMENT_SUPPORTED_BOND_TYPES,
  supportsRetirementBondType,
} from '@/features/bond-core/support-matrix';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import {
  RetirementPlannerCalculationEnvelope,
  ScenarioKind,
} from '@/features/bond-core/types/scenarios';
import { DEFAULT_RETIREMENT_INPUTS } from '@/features/retirement/constants/default-inputs';
import { formatRetirementRate } from '@/features/retirement/lib/retirement-format';
import { RetirementInputs } from '@/features/retirement/types/retirement';
import { useAppI18n } from '@/i18n/client';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { formatHorizonMonths } from '@/shared/lib/format-horizon';

import { RetirementInputsPanel } from './RetirementInputsPanel';
import {
  getRetirementTaxStrategyLabel,
  RetirementDepletionWarning,
  RetirementLimitsPanel,
  RetirementReadyStatePanel,
  RetirementResultsPanel,
} from './RetirementPlannerPanels';

export const RetirementPlannerContainer: React.FC = () => {
  const { t, locale: language } = useAppI18n();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const { isCalculating, post } = useCalculationRequest();
  const currencyFormatter = useCurrencyFormatter(language, {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  });
  const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_RETIREMENT_INPUTS);
  const [isDirty, setIsDirty] = useState(true);
  const [results, setResults] = useState<RetirementPlannerCalculationEnvelope | null>(null);
  const hasTouchedMacroAssumptions = React.useRef(false);
  const formatCurrency = React.useCallback(
    (value: number) => currencyFormatter.format(value),
    [currencyFormatter],
  );
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
    const bondType = supportsRetirementBondType(inputs.bondType) ? inputs.bondType : BondType.EDO;
    const response = await post<RetirementPlannerCalculationEnvelope>(
      getCalculationEndpoint(ScenarioKind.RETIREMENT_PLANNER),
      {
        ...inputs,
        bondType,
      },
    );
    setResults(response);
    setIsDirty(false);
  };
  const chartData = useMemo(
    () =>
      results?.result.timeline
        .filter((_, index) => index % 12 === 0)
        .map((point) => ({
          year: point.year,
          date: point.date,
          balance: point.balance,
          withdrawal: point.withdrawal,
        })) ?? [],
    [results],
  );
  const scenarioCoverage = useMemo(() => {
    if (!results) {
      return null;
    }
    const finalMonth = results.result.timeline[results.result.timeline.length - 1];
    if (!finalMonth) {
      return null;
    }
    return formatHorizonMonths(finalMonth.year * 12 + finalMonth.month, language);
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
  return (
    <CalculatorPageShell
      title={labels.pageTitle}
      description={labels.pageDescription}
      icon={<Wallet className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={!!results}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4">
          <RetirementInputsPanel
            inputs={inputs}
            language={language}
            labels={labels}
            taxStrategyLabels={taxStrategyLabels}
            formatCurrency={formatCurrency}
            formatRate={formatRetirementRate}
            onUpdateInput={updateInput}
          />
        </aside>

        <div className="space-y-8 xl:col-span-8">
          {results ? (
            <RetirementResultsPanel
              results={results}
              isDirty={isDirty}
              labels={labels}
              chartData={chartData}
              scenarioCoverage={scenarioCoverage}
              language={language}
              inputsHorizonYears={inputs.horizonYears}
              taxStrategyLabel={getRetirementTaxStrategyLabel(
                taxStrategyLabels,
                inputs.taxStrategy,
              )}
              formatCurrency={formatCurrency}
            />
          ) : (
            <RetirementReadyStatePanel
              inputs={inputs}
              labels={labels}
              language={language}
              formatCurrency={formatCurrency}
              t={t}
            />
          )}

          <RetirementLimitsPanel labels={labels} modelLimits={modelLimits} />

          <RetirementDepletionWarning
            exhaustionDate={results?.result.exhaustionDate}
            labels={labels}
          />
        </div>
      </div>

      <RecalculateButton
        isDirty={isDirty}
        loading={isCalculating}
        hasResults={!!results}
        onClick={handleCalculate}
      />
    </CalculatorPageShell>
  );
};
