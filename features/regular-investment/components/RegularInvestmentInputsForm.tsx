'use client';
import React, { useState } from 'react';
import { BondType, RegularInvestmentInputs } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getHorizonMonths } from '@/shared/lib/date-timing';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { ScenarioFieldset } from '@/shared/components/forms/ScenarioFieldset';
import { BondSelectionSection } from './inputs/BondSelectionSection';
import { ContributionPlanSection } from './inputs/ContributionPlanSection';
import { TimingSection } from './inputs/TimingSection';
import { AdvancedSettingsSection } from './inputs/AdvancedSettingsSection';

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
        <section className="surface-shell flex h-[600px] w-full items-center justify-center p-6">
            <p className="text-sm font-semibold text-muted-foreground">
              {t('common.loading')}
            </p>
        </section>
      );
    }

    const currentDef = definitions[inputs.bondType];
    const dateLocale = getDateFnsLocale(language);
    const investmentHorizonMonths =
      inputs.investmentHorizonMonths ??
      getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);
    const investmentHorizonYears = Math.max(1 / 12, investmentHorizonMonths / 12);
    const isDivisibleBy100 =
      inputs.contributionAmount % 100 === 0 && inputs.contributionAmount > 0;

    return (
      <section className="surface-shell w-full space-y-8 p-5 md:p-6">
        <div className="space-y-2 border-b border-border pb-4">
          <h2 className="ui-section-title">
            {t('bonds.regular_calculator')}
          </h2>
          <p className="ui-body text-muted-foreground">
            {t('regular_investment_page.form_description')}
          </p>
        </div>
        <div className="space-y-8">
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

          <div className="pt-2">
            <div className="space-y-2 rounded-lg border border-border bg-muted/25 px-4 py-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('bonds.duration')}:</span>
                <span className="font-bold">{formatBondDuration(inputs.duration, language)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  {inputs.bondType === 'OTS'
                    ? t('bonds.yield_three_months')
                    : inputs.bondType === 'ROR' || inputs.bondType === 'DOR'
                      ? t('bonds.first_month_rate')
                      : t('bonds.first_year_rate')}
                  :
                </span>
                <span className="font-bold">{inputs.firstYearRate}%</span>
              </div>
              {currentDef.margin > 0 ? (
                <div className="flex justify-between">
                  <span>{t('bonds.margin')}:</span>
                  <span className="font-bold">{inputs.margin}%</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>{t('bonds.payout_type')}:</span>
                <span className="font-bold">
                  {inputs.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('bonds.early_withdrawal_fee')}:</span>
                <span className="font-bold">{inputs.earlyWithdrawalFee} PLN</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  },
);

RegularInvestmentInputsForm.displayName = 'RegularInvestmentInputsForm';
