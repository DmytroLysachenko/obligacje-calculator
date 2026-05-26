'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BondType, RegularInvestmentInputs } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getHorizonMonths } from '@/shared/lib/date-timing';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { getDateFnsLocale } from '@/i18n/locale-utils';
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
        <Card className="w-full border-primary/10 shadow-sm">
          <CardContent className="flex h-[600px] items-center justify-center">
            <p className="text-base font-semibold tracking-[0.08em] text-muted-foreground">
              {t('common.loading')}
            </p>
          </CardContent>
        </Card>
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
      <Card className="w-full border-primary/10 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-[1.65rem] font-black tracking-tight">
            {t('bonds.regular_calculator')}
          </CardTitle>
          <CardDescription className="text-[15px] leading-7">
            {t('regular_investment_page.form_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          <BondSelectionSection
            bondType={inputs.bondType}
            definitions={definitions}
            language={language}
            onBondTypeChange={onBondTypeChange}
            t={t}
          />

          <Separator />

          <ContributionPlanSection
            contributionAmount={inputs.contributionAmount}
            frequency={inputs.frequency}
            taxStrategy={inputs.taxStrategy}
            isDivisibleBy100={isDivisibleBy100}
            onUpdate={onUpdate}
            t={t}
          />

          <TimingSection
            timingMode={inputs.timingMode}
            purchaseDate={inputs.purchaseDate}
            withdrawalDate={inputs.withdrawalDate}
            investmentHorizonYears={investmentHorizonYears}
            dateLocale={dateLocale}
            onUpdate={onUpdate}
            t={t}
          />

          <AdvancedSettingsSection
            inputs={inputs}
            currentDef={currentDef}
            showCustomTax={showCustomTax}
            onShowCustomTaxChange={setShowCustomTax}
            onUpdate={onUpdate}
            t={t}
          />

          <div className="pt-2">
            <div className="space-y-1.5 rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    );
  },
);

RegularInvestmentInputsForm.displayName = 'RegularInvestmentInputsForm';
