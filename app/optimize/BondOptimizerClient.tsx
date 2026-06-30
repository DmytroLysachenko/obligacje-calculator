'use client';

import { TrendingUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { TaxStrategy } from '@/features/bond-core/types';
import {
  BondOptimizerCalculationEnvelope,
  ScenarioKind,
} from '@/features/bond-core/types/scenarios';
import { OptimizerInputPanel } from '@/features/optimizer/components/OptimizerInputPanel';
import {
  OptimizerLeadingDetailSection,
  OptimizerLeadingMetrics,
  OptimizerRankedOutcomesSection,
  OptimizerReadyState,
} from '@/features/optimizer/components/OptimizerSections';
import {
  applyOptimizerClientInputUpdate,
  buildOptimizerTaxStrategyLabels,
  getOptimizerClientViewState,
} from '@/features/optimizer/lib/optimizer-client-state';
import {
  applyOptimizerMacroDefaults,
  buildDefaultOptimizerInputs,
  buildOptimizerReadySteps,
  type OptimizerInputKey,
  type OptimizerInputs,
} from '@/features/optimizer/lib/optimizer-state';
import { useAppI18n } from '@/i18n/client';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { useCurrencyFormatter, usePercentFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { logClientError } from '@/shared/lib/client-logger';

export default function BondOptimizerClient() {
  const { t, locale: language } = useAppI18n();
  const { defaults: macroDefaults } = useMacroAssumptionDefaults();
  const [inputs, setInputs] = useState<OptimizerInputs>(() => buildDefaultOptimizerInputs());
  const [envelope, setEnvelope] = useState<BondOptimizerCalculationEnvelope | null>(null);
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

    setInputs((previous) =>
      applyOptimizerMacroDefaults(previous, macroDefaults, hasTouchedMacroAssumptions.current),
    );
  }, [macroDefaults]);

  const { results, leadingScenario, horizonYears, hasResults } = useMemo(
    () => getOptimizerClientViewState({ inputs, envelope }),
    [envelope, inputs],
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
    () =>
      buildOptimizerTaxStrategyLabels({
        standard: t('optimizer_page.tax_strategies.standard'),
        ike: t('optimizer_page.tax_strategies.ike'),
        ikze: t('optimizer_page.tax_strategies.ikze'),
      }),
    [t],
  );

  const updateInput = (key: OptimizerInputKey, value: string | number | boolean) => {
    const update = applyOptimizerClientInputUpdate(inputs, key, value);
    if (update.touchedMacroAssumptions) {
      hasTouchedMacroAssumptions.current = true;
    }
    setInputs(update.inputs);
    setIsDirty(true);
  };

  const handleCalculate = async () => {
    try {
      const data = await post<BondOptimizerCalculationEnvelope>(
        getCalculationEndpoint(ScenarioKind.BOND_OPTIMIZER),
        inputs,
      );
      setEnvelope(data);
      setIsDirty(false);
    } catch (error) {
      logClientError('Scenario ranking error:', error);
    }
  };

  return (
    <CalculatorPageShell
      title={t('optimizer_page.page_title')}
      description={t('optimizer_page.page_description')}
      icon={<TrendingUp className="h-8 w-8" />}
      isCalculating={isCalculating}
      isDirty={isDirty}
      hasResults={hasResults}
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4">
          <OptimizerInputPanel
            inputs={inputs}
            horizonYears={horizonYears}
            formatCurrency={formatCurrency}
            updateInput={updateInput}
          />
        </aside>

        <section className="space-y-6 xl:col-span-8">
          {results && leadingScenario ? (
            <>
              {isDirty ? (
                <div className="ui-inline-notice border-l-2 border-warning text-warning">
                  {t('optimizer_page.stale_results')}
                </div>
              ) : null}

              <OptimizerLeadingMetrics
                labels={{
                  leadingPayoutLabel: t('optimizer_page.metrics.leading_payout_label'),
                  leadingPayoutDetail: t('optimizer_page.metrics.leading_payout_detail', {
                    years: horizonYears,
                  }),
                  leadingBondLabel: t('optimizer_page.metrics.leading_bond_label'),
                  netProfitLabel: t('optimizer_page.metrics.net_profit_label'),
                  netProfitDetail: t('optimizer_page.metrics.net_profit_detail'),
                  roiLabel: t('optimizer_page.metrics.roi_label'),
                  roiDetail: t('optimizer_page.metrics.roi_detail'),
                }}
                leadingScenario={leadingScenario}
                initialInvestment={inputs.initialInvestment}
                formatCurrency={formatCurrency}
                formatPercentValue={formatPercentValue}
              />

              <OptimizerLeadingDetailSection
                title={t('optimizer_page.leading_card_title')}
                description={t('optimizer_page.leading_card_description')}
                taxWrapperLabel={t('optimizer_page.tax_wrapper_label')}
                taxStrategyLabel={taxStrategyLabels[inputs.taxStrategy]}
                leadingScenario={leadingScenario}
                expectedInflation={inputs.expectedInflation}
                expectedNbpRate={inputs.expectedNbpRate}
                formatCurrency={formatCurrency}
                labels={{
                  taxPaid: t('optimizer_page.tax_paid_label'),
                  inflationInput: t('optimizer_page.inflation_input_label'),
                  nbpInput: t('optimizer_page.nbp_input_label'),
                }}
              />

              <OptimizerRankedOutcomesSection
                title={t('optimizer_page.ranked_outcomes_title')}
                description={t('optimizer_page.ranked_outcomes_description', {
                  years: horizonYears,
                })}
                rankedBonds={results.rankedBonds}
                leadingScenario={leadingScenario}
                formatCurrency={formatCurrency}
                labels={{
                  leadingGapPrimary: t('optimizer_page.leading_gap_primary'),
                  leadingGapSecondary: (gap) => t('optimizer_page.leading_gap_secondary', { gap }),
                }}
              />

              <SecondaryInsightAccordion
                title={t('optimizer_page.guardrail_title')}
                description={t('optimizer_page.guardrail_description')}
                badge={t('optimizer_page.guardrail_badge')}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInlineNotice
                    description={t('optimizer_page.guardrail_points.assumption_shift')}
                  />
                  <FormInlineNotice
                    description={t('optimizer_page.guardrail_points.suitability')}
                  />
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
            <OptimizerReadyState
              badge={t('optimizer_page.ready_badge')}
              title={t('optimizer_page.ready_title')}
              description={t('optimizer_page.ready_description')}
              steps={buildOptimizerReadySteps({
                amount: formatCurrency(inputs.initialInvestment),
                months: inputs.investmentHorizonMonths,
                labels: {
                  amountTitle: t('optimizer_page.ready_steps.amount.title'),
                  amountDescription: (amount) =>
                    t('optimizer_page.ready_steps.amount.description', { amount }),
                  horizonTitle: t('optimizer_page.ready_steps.horizon.title'),
                  horizonDescription: (months) =>
                    t('optimizer_page.ready_steps.horizon.description', { months }),
                  scopeTitle: t('optimizer_page.ready_steps.scope.title'),
                  scopeDescription: t('optimizer_page.ready_steps.scope.description'),
                },
              })}
              footerText={t('optimizer_page.ready_footer')}
            />
          )}
        </section>
      </div>

      <RecalculateButton
        isDirty={isDirty}
        loading={isCalculating}
        hasResults={hasResults}
        onClick={handleCalculate}
      />
    </CalculatorPageShell>
  );
}
