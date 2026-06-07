'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { BondInputs } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';

interface BondDisplaySectionProps {
  inputs: BondInputs;
  onUpdate: (key: keyof BondInputs, value: unknown) => void;
  showCustomTax: boolean;
  setShowCustomTax: (value: boolean) => void;
}

export const BondDisplaySection: React.FC<BondDisplaySectionProps> = React.memo(({
  inputs,
  onUpdate,
  showCustomTax,
  setShowCustomTax,
}) => {
  const { t } = useAppI18n();
  const chartStep = inputs.chartStep ?? 'yearly';

  return (
    <div className="space-y-4 pb-5">
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground">
          {t('bonds.chart.granularity')}
        </Label>
        <SegmentedControl
          value={chartStep}
          options={(['monthly', 'quarterly', 'yearly'] as const).map((step) => ({
            value: step,
            label: t(`bonds.chart.periods.${step}`),
          }))}
          onValueChange={(step) => onUpdate('chartStep', step)}
          className="grid-cols-3"
          itemClassName="h-8"
        />
      </div>

      <FormInlineNotice
        title={(
          <span className="inline-flex items-center gap-2">
            {t('bonds.inflation.adjusted')}
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                {t('bonds.glossary.real_value')}
              </TooltipContent>
            </Tooltip>
          </span>
        )}
        description={t('bonds.show_purchasing_power')}
        action={(
          <Switch
            checked={inputs.showRealValue}
            onCheckedChange={(checked) => onUpdate('showRealValue', checked)}
          />
        )}
      />

      <FormInlineNotice
        title={t('bonds.custom_tax_rate')}
        description={t('bonds.standard_tax_note')}
        action={(
          <Switch
            checked={showCustomTax}
            onCheckedChange={setShowCustomTax}
          />
        )}
      />

      {showCustomTax && (
        <div className="border-l-2 border-border px-4 py-2">
          <Input
            type="number"
            className="font-medium"
            value={inputs.taxRate}
            onChange={(e) => onUpdate('taxRate', Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
});

BondDisplaySection.displayName = 'BondDisplaySection';




