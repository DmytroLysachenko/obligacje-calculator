'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { BondInputs } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

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

  return (
    <div className="space-y-4 pb-5">
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground">
          {t('bonds.chart.granularity')}
        </Label>
        <div className="flex gap-1 rounded-md border border-border bg-card p-1">
          {(['monthly', 'quarterly', 'yearly'] as const).map((step) => (
            <Button
              key={step}
              type="button"
              variant={inputs.chartStep === step || (!inputs.chartStep && step === 'yearly') ? 'default' : 'ghost'}
              className={cn(
                "h-8 flex-1 text-xs font-medium",
              )}
              onClick={() => onUpdate('chartStep', step)}
            >
              {t(`bonds.chart.periods.${step}`)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-muted/35 p-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-foreground">{t('bonds.inflation.adjusted')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                {t('bonds.glossary.real_value')}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('bonds.show_purchasing_power')}
          </p>
        </div>
        <Switch
          checked={inputs.showRealValue}
          onCheckedChange={(checked) => onUpdate('showRealValue', checked)}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-card p-4">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold">{t('bonds.custom_tax_rate')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('bonds.standard_tax_note')}
          </p>
        </div>
        <Switch
          checked={showCustomTax}
          onCheckedChange={setShowCustomTax}
        />
      </div>

      {showCustomTax && (
        <div className="px-4 py-2">
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




