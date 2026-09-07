'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  InvestmentFrequency,
  RegularInvestmentInputs,
  TaxStrategy,
} from '@/features/bond-core/types';
import {
  bondQuantityFromInvestment,
  investmentFromBondQuantity,
  MAX_BOND_QUANTITY,
} from '@/features/bond-core/utils/bond-quantity';
import type { Language } from '@/i18n/config';
import { FormField } from '@/shared/components/forms/FormField';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { RangeField } from '@/shared/components/forms/RangeField';
import { useNumberFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { type FieldUpdater } from '@/shared/types/field-updater';

type ContributionPlanSectionProps = {
  contributionAmount: number;
  language: Language;
  frequency: InvestmentFrequency;
  taxStrategy: TaxStrategy;
  onUpdate: FieldUpdater<RegularInvestmentInputs>;
  t: (key: string) => string;
};

export function ContributionPlanSection({
  contributionAmount,
  language,
  frequency,
  taxStrategy,
  onUpdate,
  t,
}: ContributionPlanSectionProps) {
  const numberFormatter = useNumberFormatter(language);
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
            <p className="text-[15px] font-semibold">{t('bonds.bond_quantity')}</p>
            <span className="text-sm font-bold text-primary">
              {bondQuantityFromInvestment(contributionAmount)} {t('bonds.units')}
            </span>
          </div>
          <p className="ui-metadata text-muted-foreground">
            {numberFormatter.format(contributionAmount)} PLN
          </p>
          <div className="space-y-4">
            <FormField
              label={t('bonds.bond_quantity')}
              htmlFor="contributionAmount"
              tooltip={t('regular_form.contribution_help')}
            >
              <Input
                id="contributionAmount"
                type="number"
                min={1}
                max={MAX_BOND_QUANTITY}
                step={1}
                inputMode="numeric"
                value={bondQuantityFromInvestment(contributionAmount)}
                onChange={(event) => {
                  const investment = investmentFromBondQuantity(Number(event.target.value));
                  if (investment !== null) onUpdate('contributionAmount', investment);
                }}
              />
            </FormField>
            <RangeField
              label={t('bonds.bond_quantity')}
              value={bondQuantityFromInvestment(contributionAmount)}
              min={1}
              max={MAX_BOND_QUANTITY}
              step={1}
              unit={t('bonds.units')}
              onCommit={(value) => {
                const investment = investmentFromBondQuantity(value);
                if (investment !== null) onUpdate('contributionAmount', investment);
              }}
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
