'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, AlertCircle, HelpCircle } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';
import { BondInputs, TaxStrategy } from '@/features/bond-core/types';
import { useLanguage } from '@/i18n';
import { GLOSSARY } from '@/shared/constants/glossary';
import { toDateString } from '@/shared/lib/date-timing';
import { cn } from '@/lib/utils';

interface BondTimingSectionProps {
  inputs: BondInputs;
  onUpdate: (key: keyof BondInputs, value: any) => void;
  investmentHorizonYears: number;
  investmentHorizonMonths: number;
  currentDef: any;
  hasMounted: boolean;
}

export const BondTimingSection: React.FC<BondTimingSectionProps> = React.memo(({
  inputs,
  onUpdate,
  investmentHorizonYears,
  investmentHorizonMonths,
  currentDef,
  hasMounted,
}) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pl' ? pl : enGB;
  const isFutureDate = isAfter(parseISO(inputs.purchaseDate), new Date());

  return (
    <div className="space-y-6 pb-6">
      <div className="space-y-3">
        <Label className="font-semibold">{t('bonds.timing_mode')}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={(!inputs.timingMode || inputs.timingMode === 'general') ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate('timingMode', 'general')}
          >
            {t('bonds.timing_general')}
          </Button>
          <Button
            type="button"
            variant={inputs.timingMode === 'exact' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate('timingMode', 'exact')}
          >
            {t('bonds.timing_exact')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            {t('bonds.purchase_date')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11 px-3",
                  !inputs.purchaseDate && "text-muted-foreground",
                  hasMounted && isFutureDate && "border-destructive focus-visible:ring-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {hasMounted && inputs.purchaseDate ? format(parseISO(inputs.purchaseDate), 'PPP', { locale: dateLocale }) : <span>{t('bonds.pick_date')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                fromYear={2010}
                toYear={2050}
                selected={parseISO(inputs.purchaseDate)}
                onSelect={(date) => date && onUpdate('purchaseDate', toDateString(date))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {hasMounted && isFutureDate && (
            <div className="flex items-center gap-2 text-destructive text-[10px] font-medium animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-3 w-3" />
              <span>{t('bonds.error_future_date')}</span>
            </div>
          )}
        </div>
        {inputs.timingMode === 'exact' ? (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              {t('bonds.withdrawal_date')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 px-3",
                    !inputs.withdrawalDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {hasMounted && inputs.withdrawalDate ? format(parseISO(inputs.withdrawalDate), 'PPP', { locale: dateLocale }) : <span>{t('bonds.pick_date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  fromYear={2010}
                  toYear={2050}
                  selected={parseISO(inputs.withdrawalDate)}
                  onSelect={(date) => date && onUpdate('withdrawalDate', toDateString(date))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <Label className="font-semibold">{t('bonds.investment_horizon')}</Label>
          <span className="text-sm font-black text-primary">
            {investmentHorizonYears % 1 === 0 ? investmentHorizonYears.toFixed(0) : investmentHorizonYears.toFixed(2)} {t('common.years')}
          </span>
        </div>
        <Slider
          value={[investmentHorizonMonths]}
          min={1}
          max={360}
          step={1}
          onValueChange={([value]) => onUpdate('investmentHorizonMonths', value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="font-semibold">{t('bonds.tax_strategy')}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              {GLOSSARY.TAX_WRAPPER.definition[language]}
            </TooltipContent>
          </Tooltip>
        </div>
        <Select
          value={inputs.taxStrategy}
          onValueChange={(value) => onUpdate('taxStrategy', value as TaxStrategy)}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TaxStrategy.STANDARD}>{t('bonds.tax_standard')}</SelectItem>
            <SelectItem value={TaxStrategy.IKE}>{t('bonds.tax_ike')}</SelectItem>
            <SelectItem value={TaxStrategy.IKZE}>{t('bonds.tax_ikze')}</SelectItem>
          </SelectContent>
        </Select>
        
        {(inputs.taxStrategy === TaxStrategy.IKE || inputs.taxStrategy === TaxStrategy.IKZE) && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-dashed animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold uppercase tracking-tight">{t('bonds.use_tax_limit')}</Label>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[200px]">
                {t('bonds.use_tax_limit_desc')}
              </p>
            </div>
            <Switch
              checked={!!inputs.useTaxWrapperLimit}
              onCheckedChange={(checked) => onUpdate('useTaxWrapperLimit', checked)}
            />
          </div>
        )}
      </div>

      {currentDef.rebuyDiscount > 0 && (
        <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-xl border border-green-100">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold text-green-800">{t('bonds.is_rebought')}</Label>
            <p className="text-[10px] text-green-600 font-medium italic">
              {t('bonds.discount_per_bond', { amount: currentDef.rebuyDiscount.toFixed(2) })}
            </p>
          </div>
          <Switch
            checked={inputs.isRebought}
            onCheckedChange={(checked) => onUpdate('isRebought', checked)}
          />
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold text-primary">{t('bonds.reinvest')}</Label>
          <p className="text-[10px] text-muted-foreground font-medium italic">
            {t('bonds.rollover_desc')}
          </p>
        </div>
        <Switch
          checked={!!inputs.rollover}
          onCheckedChange={(checked) => onUpdate('rollover', checked)}
        />
      </div>
    </div>
  );
});

BondTimingSection.displayName = 'BondTimingSection';
