'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { useAppI18n } from '@/i18n/client';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { getBondSupportMeta, isFamilyBondType } from '@/features/bond-core/support-matrix';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { getBondRateContextCopy } from '@/shared/lib/bond-rate-context';
import { RateContextNote } from '@/shared/components/results/RateContextNote';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
interface ScenarioOverrideCardProps {
    title: string;
    colorClass: string;
    bondType: BondType;
    onBondTypeChange: (value: BondType) => void;
    isRebought?: boolean;
    onReboughtChange: (value: boolean) => void;
    taxStrategy?: TaxStrategy;
    onTaxStrategyChange: (value: TaxStrategy | undefined) => void;
    customHorizonEnabled: boolean;
    onCustomHorizonEnabledChange: (value: boolean) => void;
    customHorizonMonths?: number;
    onCustomHorizonMonthsChange: (value: number | undefined) => void;
}
export const ScenarioOverrideCard: React.FC<ScenarioOverrideCardProps> = ({ title, colorClass, bondType, onBondTypeChange, isRebought, onReboughtChange, taxStrategy, onTaxStrategyChange, customHorizonEnabled, onCustomHorizonEnabledChange, customHorizonMonths, onCustomHorizonMonthsChange, }) => {
    const { t, locale: language } = useAppI18n();
    const { definitions } = useBondDefinitions();
    const activeDefinition = definitions?.[bondType];
    const activeRateContext = activeDefinition
        ? getBondRateContextCopy(bondType, Number(activeDefinition.firstYearRate), Number(activeDefinition.margin), t)
        : null;
    const formatBondLabel = (type: BondType) => formatBondDuration(definitions?.[type]?.duration ?? 1, language);
    const formatRateStyle = (type: BondType) => {
        const definition = definitions?.[type];
        if (!definition) {
            return null;
        }
        return getBondRateContextCopy(type, Number(definition.firstYearRate), Number(definition.margin), t).styleLabel;
    };
    return (<section className="space-y-5" data-scenario-tone={colorClass}>
      <div className="border-b border-border pb-4">
        <h3 className="ui-card-title">
          {title}
        </h3>
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {t('bonds.bond.type')}
          </Label>
          <Select value={bondType} onValueChange={(value) => onBondTypeChange(value as BondType)}>
            <SelectTrigger className="h-12 w-full min-w-0 rounded-md border-border bg-card font-semibold [&>span]:truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BondType).map((type) => (<SelectItem key={type} value={type} className="py-2.5">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-black tracking-tight">{type}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {formatBondLabel(type)}
                      </span>
                      {isFamilyBondType(type) ? (<span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                          {t('comparison.family_bond_badge')}
                        </span>) : null}
                    </div>
                    <span className="truncate text-sm font-medium text-muted-foreground">
                      {definitions?.[type]?.fullName[language] ?? type}
                    </span>
                  </div>
                </SelectItem>))}
            </SelectContent>
          </Select>
          <RateContextNote title={t('comparison.override_scope_title')} badges={[
            formatBondLabel(bondType),
            ...(formatRateStyle(bondType) ? [formatRateStyle(bondType) as string] : []),
        ]} narrative={activeRateContext?.narrative ?? getBondSupportMeta(bondType).description}/>
          {isFamilyBondType(bondType) ? (<p className="text-xs leading-5 text-warning">
              {t('comparison.family_override_note')}
            </p>) : null}
          <p className="text-xs leading-5 text-muted-foreground">
            {getBondSupportMeta(bondType).description}
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-sm font-semibold">
            {t('comparison.base_follows_shared_title')}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t('comparison.base_follows_shared_desc')}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
          <div>
            <p className="text-sm font-semibold">{t('bonds.is_rebought')}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('bonds.is_rebought_desc')}
            </p>
          </div>
          <Switch checked={!!isRebought} onCheckedChange={onReboughtChange}/>
        </div>

        <SecondaryInsightAccordion title={t('comparison.optional_overrides_title')} description={t('comparison.optional_overrides_desc')} badge={t('comparison.helper_secondary')} className="mt-0">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {t('bonds.tax_strategy')}
              </Label>
              <Select value={taxStrategy ?? 'shared'} onValueChange={(value) => onTaxStrategyChange(value === 'shared' ? undefined : (value as TaxStrategy))}>
                <SelectTrigger className="h-11 w-full min-w-0 [&>span]:truncate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">{t('comparison.use_shared_tax')}</SelectItem>
                  <SelectItem value={TaxStrategy.STANDARD}>
                    {t('bonds.tax_standard')}
                  </SelectItem>
                  <SelectItem value={TaxStrategy.IKE}>
                    {t('bonds.tax_ike')}
                  </SelectItem>
                  <SelectItem value={TaxStrategy.IKZE}>
                    {t('bonds.tax_ikze')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                {t('comparison.tax_override_desc')}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div>
                <p className="text-sm font-semibold">{t('comparison.custom_horizon')}</p>
                <p className="text-[10px] text-muted-foreground">
                  {t('comparison.custom_horizon_desc')}
                </p>
              </div>
              <Switch checked={customHorizonEnabled} onCheckedChange={onCustomHorizonEnabledChange}/>
            </div>

            {customHorizonEnabled ? (<div className="space-y-3">
                <Label className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                  {t('comparison.scenario_horizon')}
                </Label>
                <CommittedSliderInput value={customHorizonMonths ?? 12} min={12} max={360} step={1} unit="mo" onCommit={(value) => onCustomHorizonMonthsChange(value)}/>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t('comparison.horizon_override_desc')}
                </p>
              </div>) : null}
          </div>
        </SecondaryInsightAccordion>
      </div>
    </section>);
};





