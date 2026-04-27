'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { BondInputs } from '@/features/bond-core/types';
import { useLanguage } from '@/i18n';
import { GLOSSARY } from '@/shared/constants/glossary';
import { cn } from '@/lib/utils';

interface BondDisplaySectionProps {
  inputs: BondInputs;
  onUpdate: (key: keyof BondInputs, value: any) => void;
  showCustomTax: boolean;
  setShowCustomTax: (value: boolean) => void;
}

export const BondDisplaySection: React.FC<BondDisplaySectionProps> = React.memo(({
  inputs,
  onUpdate,
  showCustomTax,
  setShowCustomTax,
}) => {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4 pb-6">
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
          {t('bonds.chart_granularity')}
        </Label>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border">
          {(['monthly', 'quarterly', 'yearly'] as const).map((step) => (
            <Button
              key={step}
              type="button"
              variant={inputs.chartStep === step || (!inputs.chartStep && step === 'yearly') ? 'default' : 'ghost'}
              className={cn(
                "flex-1 h-8 text-[10px] font-black uppercase tracking-tighter transition-all",
                (inputs.chartStep === step || (!inputs.chartStep && step === 'yearly')) && "shadow-sm"
              )}
              onClick={() => onUpdate('chartStep', step)}
            >
              {t(`bonds.granularity_${step}`)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-bold text-primary uppercase">{t('bonds.inflation_adjusted')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-primary/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                {GLOSSARY.REAL_VALUE.definition[language]}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium italic">
            {t('bonds.show_purchasing_power')}
          </p>
        </div>
        <Switch
          checked={inputs.showRealValue}
          onCheckedChange={(checked) => onUpdate('showRealValue', checked)}
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold">{t('bonds.custom_tax_rate')}</Label>
          <p className="text-[10px] text-muted-foreground font-medium italic">
            {t('bonds.standard_tax_note')}
          </p>
        </div>
        <Switch
          checked={showCustomTax}
          onCheckedChange={setShowCustomTax}
        />
      </div>

      {showCustomTax && (
        <div className="px-4 py-2 animate-in fade-in zoom-in-95 duration-200">
          <Input
            type="number"
            className="h-10 font-bold"
            value={inputs.taxRate}
            onChange={(e) => onUpdate('taxRate', Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
});

BondDisplaySection.displayName = 'BondDisplaySection';
