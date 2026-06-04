'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/shared/components/forms/FormField';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { MoneyInput } from '@/shared/components/forms/MoneyInput';
import { RangeField } from '@/shared/components/forms/RangeField';
import { InvestmentFrequency, TaxStrategy } from '@/features/bond-core/types';

type ContributionPlanSectionProps = {
  contributionAmount: number;
  frequency: InvestmentFrequency;
  taxStrategy: TaxStrategy;
  isDivisibleBy100: boolean;
  onUpdate: (key: string, value: unknown) => void;
  t: (key: string) => string;
};

export function ContributionPlanSection({
  contributionAmount,
  frequency,
  taxStrategy,
  isDivisibleBy100,
  onUpdate,
  t,
}: ContributionPlanSectionProps) {
  const taxOptions = [
    { value: TaxStrategy.STANDARD, label: t('bonds.tax_standard') },
    { value: TaxStrategy.IKE, label: t('bonds.tax_ike') },
    { value: TaxStrategy.IKZE, label: t('bonds.tax_ikze') },
  ];
  const frequencyOptions = Object.values(InvestmentFrequency).map((freq) => ({
    value: freq,
    label: t(`bonds.frequency.${freq.toLowerCase()}`),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-semibold">{t('bonds.tax_strategy')}</p>
          <Badge variant="secondary" className="text-[11px] font-medium">
            {t('comparison.configuration')}
          </Badge>
        </div>
        <FormSelect
          label={t('bonds.tax_strategy')}
          value={taxStrategy}
          options={taxOptions}
          tooltip={t('bonds.tax_strategy')}
          onValueChange={(value) => onUpdate('taxStrategy', value as TaxStrategy)}
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold">{t('bonds.monthly_investment')}</p>
            <span className="text-sm font-bold text-primary">{contributionAmount} PLN</span>
          </div>
          <div className="space-y-4">
            <FormField
              label={t('bonds.monthly_investment')}
              htmlFor="contributionAmount"
              tooltip={t('regular_form.contribution_help')}
              error={!isDivisibleBy100 && contributionAmount > 0 ? (
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  {t('bonds.error_100_pln')}
                </span>
              ) : null}
            >
              <MoneyInput
                id="contributionAmount"
                value={contributionAmount}
                invalid={!isDivisibleBy100}
                onChange={(value) => onUpdate('contributionAmount', value)}
              />
            </FormField>
            <RangeField
              label={t('bonds.monthly_investment')}
              value={contributionAmount}
              min={100}
              max={20000}
              step={100}
              unit="PLN"
              onCommit={(value) => onUpdate('contributionAmount', value)}
            />
          </div>
        </div>

        <FormSelect
          id="frequency"
          label={t('bonds.frequency.label')}
          value={frequency}
          options={frequencyOptions}
          tooltip={t('regular_form.frequency_help')}
          onValueChange={(value) => onUpdate('frequency', value as InvestmentFrequency)}
        />
      </div>
    </div>
  );
}
