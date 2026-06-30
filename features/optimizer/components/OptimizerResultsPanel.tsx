'use client';

import type {
  BondOptimizerCalculationEnvelope,
  BondOptimizerResult,
  BondOptimizerResultItem,
} from '@/features/bond-core/types/scenarios';
import {
  OptimizerLeadingDetailSection,
  OptimizerLeadingMetrics,
  OptimizerRankedOutcomesSection,
  OptimizerReadyState,
} from '@/features/optimizer/components/OptimizerSections';
import {
  buildOptimizerReadySteps,
  type OptimizerInputs,
} from '@/features/optimizer/lib/optimizer-state';
import { useAppI18n } from '@/i18n/client';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';

interface OptimizerResultsPanelProps {
  envelope: BondOptimizerCalculationEnvelope | null;
  results: BondOptimizerResult | undefined;
  leadingScenario: BondOptimizerResultItem | undefined;
  inputs: OptimizerInputs;
  isDirty: boolean;
  horizonYears: string;
  taxStrategyLabel: string;
  formatCurrency: (value: number) => string;
  formatPercentValue: (value: number) => string;
}

export function OptimizerResultsPanel({
  envelope,
  results,
  leadingScenario,
  inputs,
  isDirty,
  horizonYears,
  taxStrategyLabel,
  formatCurrency,
  formatPercentValue,
}: OptimizerResultsPanelProps) {
  const { t } = useAppI18n();

  if (!results || !leadingScenario) {
    return (
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
    );
  }

  return (
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
        taxStrategyLabel={taxStrategyLabel}
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
          <FormInlineNotice description={t('optimizer_page.guardrail_points.assumption_shift')} />
          <FormInlineNotice description={t('optimizer_page.guardrail_points.suitability')} />
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
  );
}
