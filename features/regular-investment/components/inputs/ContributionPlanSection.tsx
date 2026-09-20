'use client';

import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { ScheduledContribution } from '@/features/bond-core/utils/engine/contribution-schedule';
import type { Language } from '@/i18n/config';
import { FormField } from '@/shared/components/forms/FormField';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { RangeField } from '@/shared/components/forms/RangeField';
import { useNumberFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { type FieldUpdater } from '@/shared/types/field-updater';

type ContributionPlanSectionProps = {
  contributionAmount: number;
  initialLumpSum: number;
  annualContributionIncreasePercent: number;
  oneOffContributions: Array<{ date: string; amount: number }>;
  skippedContributionDates: string[];
  contributionOverrides: Array<{ date: string; amount: number }>;
  previewRows: ScheduledContribution[];
  language: Language;
  frequency: InvestmentFrequency;
  taxStrategy: TaxStrategy;
  onUpdate: FieldUpdater<RegularInvestmentInputs>;
  t: (key: string) => string;
};

export function ContributionPlanSection({
  contributionAmount,
  initialLumpSum,
  annualContributionIncreasePercent,
  oneOffContributions,
  skippedContributionDates,
  contributionOverrides,
  previewRows,
  language,
  frequency,
  taxStrategy,
  onUpdate,
  t,
}: ContributionPlanSectionProps) {
  const [extraDate, setExtraDate] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
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
        <div className="space-y-3 rounded-md border border-border p-3">
          <p className="text-[15px] font-semibold">{t('regular_investment_page.schedule_title')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label={t('regular_investment_page.initial_lump_sum')}
              htmlFor="initialLumpSum"
            >
              <Input
                id="initialLumpSum"
                type="number"
                min={0}
                value={initialLumpSum}
                onChange={(event) => onUpdate('initialLumpSum', Number(event.target.value))}
              />
            </FormField>
            <FormField
              label={t('regular_investment_page.annual_increase')}
              htmlFor="annualIncrease"
            >
              <Input
                id="annualIncrease"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={annualContributionIncreasePercent}
                onChange={(event) =>
                  onUpdate('annualContributionIncreasePercent', Number(event.target.value))
                }
              />
            </FormField>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
            <Input
              aria-label={t('regular_investment_page.topup_date')}
              type="date"
              value={extraDate}
              onChange={(event) => setExtraDate(event.target.value)}
            />
            <Input
              aria-label={t('regular_investment_page.topup_amount')}
              type="number"
              min={0}
              value={extraAmount}
              onChange={(event) => setExtraAmount(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const amount = Number(extraAmount);
                if (extraDate && amount > 0) {
                  onUpdate('oneOffContributions', [
                    ...oneOffContributions,
                    { date: extraDate, amount },
                  ]);
                  setExtraDate('');
                  setExtraAmount('');
                }
              }}
            >
              {t('regular_investment_page.add_topup')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!extraDate}
              onClick={() => {
                if (extraDate)
                  onUpdate('skippedContributionDates', [...skippedContributionDates, extraDate]);
              }}
            >
              {t('regular_investment_page.skip_date')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!extraDate || Number(extraAmount) < 0}
              onClick={() => {
                if (extraDate && extraAmount !== '')
                  onUpdate('contributionOverrides', [
                    ...contributionOverrides.filter((item) => item.date !== extraDate),
                    { date: extraDate, amount: Number(extraAmount) },
                  ]);
              }}
            >
              {t('regular_investment_page.override_date')}
            </Button>
          </div>
          {oneOffContributions.length || skippedContributionDates.length ? (
            <ul className="ui-meta space-y-1">
              {oneOffContributions.map((item, index) => (
                <li key={`${item.date}-${index}`}>
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      onUpdate(
                        'oneOffContributions',
                        oneOffContributions.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    {item.date}: {item.amount} PLN ×
                  </button>
                </li>
              ))}
              {skippedContributionDates.map((date) => (
                <li key={date}>{date}</li>
              ))}
            </ul>
          ) : null}
          <table className="w-full text-left text-xs">
            <caption className="mb-1 text-left text-muted-foreground">
              {t('regular_investment_page.schedule_preview')}
            </caption>
            <thead>
              <tr>
                <th>{t('regular_investment_page.topup_date')}</th>
                <th>{t('regular_investment_page.topup_amount')}</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => (
                <tr key={`${row.date}-${row.kind}`}>
                  <td>{row.date}</td>
                  <td>{row.amount} PLN</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
