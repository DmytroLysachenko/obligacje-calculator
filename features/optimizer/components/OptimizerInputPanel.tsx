import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TaxStrategy } from '@/features/bond-core/types';
import {
  FAMILY_BOND_TYPES,
  getBondSupportMeta,
} from '@/features/bond-core/support-matrix';
import { useAppI18n } from '@/i18n/client';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { AdvancedAssumptionsDisclosure } from '@/shared/components/forms/AdvancedAssumptionsDisclosure';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { MacroDefaultsSummary } from '@/shared/components/market-assumptions/MacroDefaultsSummary';
import type {
  OptimizerInputKey,
  OptimizerInputs,
} from '@/features/optimizer/lib/optimizer-state';

interface OptimizerInputPanelProps {
  inputs: OptimizerInputs;
  horizonYears: string;
  formatCurrency: (value: number) => string;
  updateInput: (key: OptimizerInputKey, value: string | number | boolean) => void;
}

export function OptimizerInputPanel({
  inputs,
  horizonYears,
  formatCurrency,
  updateInput,
}: OptimizerInputPanelProps) {
  const { t } = useAppI18n();
  const taxStrategyLabels: Record<TaxStrategy, string> = useMemo(
    () => ({
      [TaxStrategy.STANDARD]: t('optimizer_page.tax_strategies.standard'),
      [TaxStrategy.IKE]: t('optimizer_page.tax_strategies.ike'),
      [TaxStrategy.IKZE]: t('optimizer_page.tax_strategies.ikze'),
    }),
    [t],
  );

  return (
    <section className="space-y-6">
      <div className="space-y-2 border-b border-border pb-4">
        <h2 className="ui-section-title">
          {t('optimizer_page.input_title')}
        </h2>
        <p className="ui-body text-muted-foreground">
          {t('optimizer_page.input_description')}
        </p>
      </div>
      <div className="space-y-6">
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
            onCommit={(value) => updateInput('initialInvestment', value)}
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
            onCommit={(value) => updateInput('investmentHorizonMonths', value)}
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
            onChange={(event) => updateInput('purchaseDate', event.target.value)}
            className="rounded-lg"
          />
        </div>

        <AdvancedAssumptionsDisclosure
          title={t('optimizer_page.advanced_title')}
          description={t('optimizer_page.advanced_description')}
        >
          <MacroDefaultsSummary showNbp compact />

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('optimizer_page.tax_strategy_label')}
            </Label>
            <FormSelect
              value={inputs.taxStrategy}
              onValueChange={(value) => updateInput('taxStrategy', value)}
              placeholder={t('optimizer_page.select_strategy')}
              options={[
                {
                  value: TaxStrategy.STANDARD,
                  label: taxStrategyLabels[TaxStrategy.STANDARD],
                },
                {
                  value: TaxStrategy.IKE,
                  label: taxStrategyLabels[TaxStrategy.IKE],
                },
                {
                  value: TaxStrategy.IKZE,
                  label: taxStrategyLabels[TaxStrategy.IKZE],
                },
              ]}
            />
          </div>

          <FormInlineNotice
            tone="warning"
            title={t('optimizer_page.family_bonds_title')}
            description={`${t('optimizer_page.family_bonds_description')} ${t('optimizer_page.family_bonds_note', {
              bonds: FAMILY_BOND_TYPES.join(' / '),
              support: getBondSupportMeta(FAMILY_BOND_TYPES[0]).shortLabel.toLowerCase(),
            })}`}
            action={(
              <Switch
                id="includeFamilyBonds"
                checked={inputs.includeFamilyBonds}
                onCheckedChange={(value) => updateInput('includeFamilyBonds', value)}
              />
            )}
          />

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
              onCommit={(value) => updateInput('expectedInflation', value)}
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
              onCommit={(value) => updateInput('expectedNbpRate', value)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormInlineNotice
              description={t('optimizer_page.macro_scope.indexed')}
            />
            <FormInlineNotice
              description={t('optimizer_page.macro_scope.floating')}
            />
          </div>
        </AdvancedAssumptionsDisclosure>

        <div className="ui-inline-notice text-muted-foreground">
          {t('optimizer_page.input_footer')}
        </div>
      </div>
    </section>
  );
}
