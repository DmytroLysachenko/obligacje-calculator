'use client';
import React from 'react';

import { Switch } from '@/components/ui/switch';
import { getBondSupportMeta, isFamilyBondType } from '@/features/bond-core/support-matrix';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { Notice } from '@/shared/components/feedback/Notice';
import { FormField } from '@/shared/components/forms/FormField';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';
import { FormSelect, FormSelectOption } from '@/shared/components/forms/FormSelect';
import { RateContextNote } from '@/shared/components/results/RateContextNote';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { ScenarioSetupCard } from '@/shared/components/scenario/ScenarioSetupCard';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getBondRateContextCopy } from '@/shared/lib/bond-rate-context';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
interface ScenarioOverrideCardProps {
  title: string;
  colorClass: 'scenario-a' | 'scenario-b';
  bondType: BondType;
  onBondTypeChange: (value: BondType) => void;
  taxStrategy?: TaxStrategy;
  onTaxStrategyChange: (value: TaxStrategy | undefined) => void;
  customHorizonEnabled: boolean;
  onCustomHorizonEnabledChange: (value: boolean) => void;
  customHorizonMonths?: number;
  onCustomHorizonMonthsChange: (value: number | undefined) => void;
}
export const ScenarioOverrideCard: React.FC<ScenarioOverrideCardProps> = ({
  title,
  colorClass,
  bondType,
  onBondTypeChange,
  taxStrategy,
  onTaxStrategyChange,
  customHorizonEnabled,
  onCustomHorizonEnabledChange,
  customHorizonMonths,
  onCustomHorizonMonthsChange,
}) => {
  const { t, locale: language } = useAppI18n();
  const { definitions } = useBondDefinitions();
  const activeDefinition = definitions?.[bondType];
  const activeRateContext = activeDefinition
    ? getBondRateContextCopy(
        bondType,
        Number(activeDefinition.firstYearRate),
        Number(activeDefinition.margin),
        t,
      )
    : null;
  const formatBondLabel = React.useCallback(
    (type: BondType) => formatBondDuration(definitions?.[type]?.duration ?? 1, language),
    [definitions, language],
  );
  const formatRateStyle = (type: BondType) => {
    const definition = definitions?.[type];
    if (!definition) {
      return null;
    }
    return getBondRateContextCopy(
      type,
      Number(definition.firstYearRate),
      Number(definition.margin),
      t,
    ).styleLabel;
  };
  const bondOptions = React.useMemo<FormSelectOption[]>(
    () =>
      Object.values(BondType).map((type) => ({
        value: type,
        label: (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="font-semibold tracking-tight">{type}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {formatBondLabel(type)}
              </span>
              {isFamilyBondType(type) ? (
                <span className="text-[10px] font-semibold text-warning">
                  {t('comparison.family_bond_badge')}
                </span>
              ) : null}
            </div>
            <span className="truncate text-xs font-medium text-muted-foreground">
              {definitions?.[type]?.fullName[language] ?? type}
            </span>
          </div>
        ),
        itemClassName: 'py-2.5',
      })),
    [definitions, formatBondLabel, language, t],
  );
  const taxOptions = React.useMemo<FormSelectOption[]>(
    () => [
      { value: 'shared', label: t('comparison.use_shared_tax') },
      { value: TaxStrategy.STANDARD, label: t('bonds.tax_standard') },
      { value: TaxStrategy.IKE, label: t('bonds.tax_ike') },
      { value: TaxStrategy.IKZE, label: t('bonds.tax_ikze') },
    ],
    [t],
  );
  return (
    <ScenarioSetupCard
      title={title}
      description={t('comparison.base_follows_shared_desc')}
      tone={colorClass}
      meta={<span className="ui-kicker text-muted-foreground">{formatBondLabel(bondType)}</span>}
    >
      <FormSelect
        label={t('bonds.bond.type')}
        value={bondType}
        onValueChange={(value) => onBondTypeChange(value as BondType)}
        options={bondOptions}
        triggerClassName="h-12 font-semibold"
      />
      <RateContextNote
        className="ui-control-group"
        title={t('comparison.override_scope_title')}
        badges={[
          formatBondLabel(bondType),
          ...(formatRateStyle(bondType) ? [formatRateStyle(bondType) as string] : []),
        ]}
        narrative={
          activeRateContext?.narrative ?? getBondSupportMeta(bondType, language).description
        }
      />
      {isFamilyBondType(bondType) ? (
        <Notice tone="warning" compact>
          {t('comparison.family_override_note')}
        </Notice>
      ) : null}
      <p className="ui-field-description">{getBondSupportMeta(bondType, language).description}</p>

      <FormInlineNotice
        title={t('comparison.base_follows_shared_title')}
        description={t('comparison.base_follows_shared_desc')}
      />

      <SecondaryInsightAccordion
        title={t('comparison.optional_overrides_title')}
        description={t('comparison.optional_overrides_desc')}
        badge={t('comparison.helper_secondary')}
        className="ui-result-panel mt-0"
      >
        <div className="ui-control-stack">
          <FormSelect
            label={t('bonds.tax_strategy')}
            value={taxStrategy ?? 'shared'}
            onValueChange={(value) =>
              onTaxStrategyChange(value === 'shared' ? undefined : (value as TaxStrategy))
            }
            options={taxOptions}
            description={t('comparison.tax_override_desc')}
          />

          <div className="ui-status-note justify-between gap-4">
            <div className="min-w-0">
              <p className="ui-label">{t('comparison.custom_horizon')}</p>
              <p className="ui-field-description">{t('comparison.custom_horizon_desc')}</p>
            </div>
            <Switch
              checked={customHorizonEnabled}
              onCheckedChange={onCustomHorizonEnabledChange}
              aria-label={t('comparison.custom_horizon')}
            />
          </div>

          {customHorizonEnabled ? (
            <div className="ui-field-stack">
              <FormField
                label={t('comparison.scenario_horizon')}
                description={t('comparison.horizon_override_desc')}
              >
                <CommittedSliderInput
                  value={customHorizonMonths ?? 12}
                  min={12}
                  max={360}
                  step={1}
                  unit={t('common.month_compact')}
                  onCommit={(value) => onCustomHorizonMonthsChange(value)}
                />
              </FormField>
            </div>
          ) : null}
        </div>
      </SecondaryInsightAccordion>
    </ScenarioSetupCard>
  );
};
