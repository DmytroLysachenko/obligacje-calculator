'use client';
import React, { useState } from 'react';

import { useAppI18n } from '@/i18n/client';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { ScenarioFieldset } from '@/shared/components/forms/ScenarioFieldset';
import { ParameterSummary } from '@/shared/components/results/ParameterSummary';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getHorizonMonths } from '@/shared/lib/date-timing';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';

import { BondType, RegularInvestmentInputs } from '../../bond-core/types';

import { AdvancedSettingsSection } from './inputs/AdvancedSettingsSection';
import { BondSelectionSection } from './inputs/BondSelectionSection';
import { ContributionPlanSection } from './inputs/ContributionPlanSection';
import { TimingSection } from './inputs/TimingSection';

interface RegularInvestmentInputsFormProps {
  inputs: RegularInvestmentInputs;
  onUpdate: {
    bivarianceHack: (key: keyof RegularInvestmentInputs | string, value: unknown) => void;
  }['bivarianceHack'];
  onBondTypeChange: (type: BondType) => void;
}

export const RegularInvestmentInputsForm: React.FC<RegularInvestmentInputsFormProps> = React.memo(
  ({ inputs, onUpdate, onBondTypeChange }) => {
    const { t, locale: language } = useAppI18n();
    const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
    const [showCustomTax, setShowCustomTax] = useState(false);

    if (isLoadingDefs || !definitions) {
      return (
        <section
          className="ui-form-panel flex h-[600px] w-full items-center justify-center"
          aria-busy="true"
        >
          <p className="text-sm font-semibold text-muted-foreground">{t('common.loading')}</p>
        </section>
      );
    }

    const currentDef = definitions[inputs.bondType];
    const dateLocale = getDateFnsLocale(language);
    const investmentHorizonMonths =
      inputs.investmentHorizonMonths ??
      getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);
    const investmentHorizonYears = Math.max(1 / 12, investmentHorizonMonths / 12);
    const isDivisibleBy100 = inputs.contributionAmount % 100 === 0 && inputs.contributionAmount > 0;

    return (
      <section
        className="ui-form-panel w-full ui-control-stack"
        aria-label={t('bonds.regular_calculator')}
      >
        <div className="ui-section-intro border-b border-border pb-5">
          <h2 className="ui-section-title">{t('bonds.regular_calculator')}</h2>
          <p className="ui-body text-muted-foreground">
            {t('regular_investment_page.form_description')}
          </p>
        </div>
        <div className="ui-control-stack">
          <ScenarioFieldset
            title={t('regular_investment_page.core_plan_title')}
            description={t('regular_investment_page.core_plan_description')}
          >
            <BondSelectionSection
              bondType={inputs.bondType}
              definitions={definitions}
              language={language}
              onBondTypeChange={onBondTypeChange}
              t={t}
            />
          </ScenarioFieldset>

          <ScenarioFieldset title={t('comparison.configuration')} divided>
            <ContributionPlanSection
              contributionAmount={inputs.contributionAmount}
              frequency={inputs.frequency}
              taxStrategy={inputs.taxStrategy}
              isDivisibleBy100={isDivisibleBy100}
              onUpdate={onUpdate}
              t={t}
            />
          </ScenarioFieldset>

          <ScenarioFieldset title={t('bonds.step_timing')} divided>
            <TimingSection
              timingMode={inputs.timingMode}
              purchaseDate={inputs.purchaseDate}
              withdrawalDate={inputs.withdrawalDate}
              investmentHorizonYears={investmentHorizonYears}
              dateLocale={dateLocale}
              onUpdate={onUpdate}
              t={t}
            />
          </ScenarioFieldset>

          <ScenarioFieldset title={t('common.advanced')} divided>
            <AdvancedSettingsSection
              inputs={inputs}
              currentDef={currentDef}
              showCustomTax={showCustomTax}
              onShowCustomTaxChange={setShowCustomTax}
              onUpdate={onUpdate}
              t={t}
            />
          </ScenarioFieldset>

          <ParameterSummary
            variant="compact"
            items={[
              {
                label: t('bonds.duration'),
                value: formatBondDuration(inputs.duration, language),
              },
              {
                label:
                  inputs.bondType === 'OTS'
                    ? t('bonds.yield_three_months')
                    : inputs.bondType === 'ROR' || inputs.bondType === 'DOR'
                      ? t('bonds.first_month_rate')
                      : t('bonds.first_year_rate'),
                value: `${inputs.firstYearRate}%`,
              },
              ...(currentDef.margin > 0
                ? [
                    {
                      label: t('bonds.margin'),
                      value: `${inputs.margin}%`,
                    },
                  ]
                : []),
              {
                label: t('bonds.payout_type'),
                value: inputs.isCapitalized ? t('bonds.capitalization') : t('bonds.payout'),
              },
              {
                label: t('bonds.early_withdrawal_fee'),
                value: `${inputs.earlyWithdrawalFee} PLN`,
              },
            ]}
          />
        </div>
      </section>
    );
  },
);

RegularInvestmentInputsForm.displayName = 'RegularInvestmentInputsForm';
