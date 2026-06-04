'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { BondInputs, TaxStrategy } from '@/features/bond-core/types';
import { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { useAppI18n } from '@/i18n/client';
import { toDateString } from '@/shared/lib/date-timing';
import { formatHorizonMonths } from '@/shared/lib/format-horizon';
import { cn } from '@/lib/utils';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { RangeField } from '@/shared/components/forms/RangeField';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
interface BondTimingSectionProps {
    inputs: BondInputs;
    onUpdate: (key: keyof BondInputs, value: string | number | boolean) => void;
    investmentHorizonYears: number;
    investmentHorizonMonths: number;
    currentDef: BondDefinition;
    hasMounted: boolean;
}
export const BondTimingSection: React.FC<BondTimingSectionProps> = React.memo(({ inputs, onUpdate, investmentHorizonMonths, currentDef, hasMounted, }) => {
    const { t, locale: language } = useAppI18n();
    const dateLocale = getDateFnsLocale(language);
    const isFutureDate = isAfter(parseISO(inputs.purchaseDate), new Date());
    const durationMonths = Math.round(currentDef.duration * 12);
    const autoRollover = investmentHorizonMonths > durationMonths;
    const taxOptions = [
        { value: TaxStrategy.STANDARD, label: t('bonds.tax_standard') },
        { value: TaxStrategy.IKE, label: t('bonds.tax_ike') },
        { value: TaxStrategy.IKZE, label: t('bonds.tax_ikze') },
    ];
    return (<div className="space-y-6">
      <div className="space-y-3">
        <Label className="font-semibold">{t('bonds.timing.mode.label')}</Label>
        <SegmentedControl
          value={inputs.timingMode ?? 'general'}
          options={[
            { value: 'general', label: t('bonds.timing.mode.general') },
            { value: 'exact', label: t('bonds.timing.mode.exact') },
          ]}
          onValueChange={(value) => onUpdate('timingMode', value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            {t('bonds.purchase_date')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start px-3 text-left font-normal", !inputs.purchaseDate && "text-muted-foreground", hasMounted && isFutureDate && "border-destructive focus-visible:ring-destructive")}>
                <CalendarIcon className="mr-2 h-4 w-4"/>
                {hasMounted && inputs.purchaseDate ? format(parseISO(inputs.purchaseDate), 'PPP', { locale: dateLocale }) : <span>{t('bonds.pick_date')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" captionLayout="dropdown" fromYear={2010} toYear={2050} selected={parseISO(inputs.purchaseDate)} onSelect={(date) => date && onUpdate('purchaseDate', toDateString(date))} initialFocus/>
            </PopoverContent>
          </Popover>
          {hasMounted && isFutureDate && (<div className="flex items-center gap-2 text-[10px] font-medium text-destructive">
              <AlertCircle className="h-3 w-3"/>
              <span>{t('bonds.error_future_date')}</span>
            </div>)}
        </div>
        {inputs.timingMode === 'exact' ? (<div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              {t('bonds.withdrawal_date')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start px-3 text-left font-normal", !inputs.withdrawalDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4"/>
                  {hasMounted && inputs.withdrawalDate ? format(parseISO(inputs.withdrawalDate), 'PPP', { locale: dateLocale }) : <span>{t('bonds.pick_date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" captionLayout="dropdown" fromYear={2010} toYear={2050} selected={parseISO(inputs.withdrawalDate)} onSelect={(date) => date && onUpdate('withdrawalDate', toDateString(date))} initialFocus/>
              </PopoverContent>
            </Popover>
          </div>) : null}
      </div>

      <RangeField
        label={t('bonds.investment_horizon')}
        value={investmentHorizonMonths}
        min={1}
        max={360}
        step={1}
        unit={t('common.month_compact')}
        valueFormatter={(value) => formatHorizonMonths(value, language)}
        onCommit={(value) => onUpdate('investmentHorizonMonths', value)}
      />

      <div className="space-y-3">
        <FormSelect
          label={t('bonds.tax_strategy')}
          value={inputs.taxStrategy}
          options={taxOptions}
          tooltip={t('bonds.glossary.tax_wrapper')}
          onValueChange={(value) => onUpdate('taxStrategy', value as TaxStrategy)}
        />
        
        {(inputs.taxStrategy === TaxStrategy.IKE || inputs.taxStrategy === TaxStrategy.IKZE) && (<div className="flex items-center justify-between rounded-lg border border-border bg-muted/25 px-3 py-3">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">{t('bonds.use_tax_limit')}</Label>
              <p className="max-w-[200px] text-xs leading-5 text-muted-foreground">
                {t('bonds.use_tax_limit_desc')}
              </p>
            </div>
            <Switch checked={!!inputs.useTaxWrapperLimit} onCheckedChange={(checked) => onUpdate('useTaxWrapperLimit', checked)}/>
          </div>)}
      </div>

      {currentDef.rebuyDiscount > 0 && (<div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-4 py-3">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold text-foreground">{t('bonds.is_rebought')}</Label>
            <p className="text-xs text-[var(--finance-success)]">
              {t('bonds.discount_per_bond', { amount: currentDef.rebuyDiscount.toFixed(2) })}
            </p>
          </div>
          <Switch checked={inputs.isRebought} onCheckedChange={(checked) => onUpdate('isRebought', checked)}/>
        </div>)}

      <div className="rounded-lg border border-border bg-muted/25 px-4 py-3">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold text-foreground">
            {t('bonds.timing.rollover_title')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {autoRollover
            ? t('bonds.timing.rollover_auto') : t('bonds.timing.single_cycle')}
          </p>
        </div>
      </div>
    </div>);
});
BondTimingSection.displayName = 'BondTimingSection';




