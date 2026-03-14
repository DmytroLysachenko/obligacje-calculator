'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { BondType, RegularInvestmentInputs, InvestmentFrequency } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { AlertCircle, CalendarIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';

interface RegularInvestmentInputsFormProps {
  inputs: RegularInvestmentInputs;
  onUpdate: (key: keyof RegularInvestmentInputs, value: string | number | boolean) => void;
  onBondTypeChange: (type: BondType) => void;
}

export const RegularInvestmentInputsForm: React.FC<RegularInvestmentInputsFormProps> = ({
  inputs,
  onUpdate,
  onBondTypeChange,
}) => {
  const { t, language } = useLanguage();
  const [showCustomTax, setShowCustomTax] = useState(false);
  const currentDef = BOND_DEFINITIONS[inputs.bondType];
  const dateLocale = language === 'pl' ? pl : enGB;

  const isDivisibleBy100 = inputs.contributionAmount % 100 === 0 && inputs.contributionAmount > 0;

  return (
    <Card className="w-full shadow-lg border-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{t('bonds.regular_calculator')}</CardTitle>
        <CardDescription>
          {t('bonds.regular_calc_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bond Type */}
        <div className="space-y-3">
          <Label htmlFor="bondType" className="font-semibold">{t('bonds.bond_type')}</Label>
          <Select
            value={inputs.bondType}
            onValueChange={(value) => onBondTypeChange(value as BondType)}
          >
            <SelectTrigger id="bondType" className="h-11">
              <SelectValue placeholder="Select bond type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BondType).map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex flex-col">
                    <span className="font-bold">{type}</span>
                    <span className="text-xs text-muted-foreground">
                      {BOND_DEFINITIONS[type].fullName[language]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1 border border-primary/5">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Info className="h-3 w-3" />
              <span>{currentDef.fullName[language]}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {currentDef.description[language]}
            </p>
          </div>
        </div>

        <Separator />

        {/* Amount & Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="contributionAmount" className="font-semibold">
              {t('bonds.monthly_investment')}
            </Label>
            <div className="relative">
              <Input
                id="contributionAmount"
                type="number"
                className={cn(
                  "h-11 pl-4 pr-12 text-lg font-medium",
                  !isDivisibleBy100 && "border-destructive focus-visible:ring-destructive"
                )}
                value={inputs.contributionAmount}
                onChange={(e) => onUpdate('contributionAmount', Number(e.target.value))}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">
                PLN
              </div>
            </div>
            {!isDivisibleBy100 && inputs.contributionAmount > 0 && (
              <div className="flex items-center gap-2 text-destructive text-[10px] font-medium">
                <AlertCircle className="h-3 w-3" />
                <span>{t('bonds.error_100_pln')}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="frequency" className="font-semibold">
              {t('bonds.frequency')}
            </Label>
            <Select
              value={inputs.frequency}
              onValueChange={(value) => onUpdate('frequency', value as InvestmentFrequency)}
            >
              <SelectTrigger id="frequency" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(InvestmentFrequency).map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {t(`bonds.freq_${freq.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              {t('bonds.start_date')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 px-3",
                    !inputs.purchaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inputs.purchaseDate ? format(parseISO(inputs.purchaseDate), 'PPP', { locale: dateLocale }) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseISO(inputs.purchaseDate)}
                  onSelect={(date) => date && onUpdate('purchaseDate', date.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              {t('bonds.withdrawal_date')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 px-3",
                    !inputs.withdrawalDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inputs.withdrawalDate ? format(parseISO(inputs.withdrawalDate), 'PPP', { locale: dateLocale }) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseISO(inputs.withdrawalDate)}
                  onSelect={(date) => date && onUpdate('withdrawalDate', date.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Horizon */}
        <div className="space-y-3">
          <Label htmlFor="totalHorizon" className="font-semibold">
            {t('bonds.investment_horizon')}
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="totalHorizon"
              type="range"
              min="1"
              max="30"
              step="1"
              className="flex-1"
              value={inputs.totalHorizon}
              onChange={(e) => onUpdate('totalHorizon', Number(e.target.value))}
            />
            <span className="text-lg font-bold min-w-[3rem] text-center">
              {inputs.totalHorizon}
            </span>
            <span className="text-sm text-muted-foreground">{t('common.years')}</span>
          </div>
        </div>

        <Separator />

        {/* Inflation & Margin */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expectedInflation" className="text-xs font-semibold uppercase text-muted-foreground">
              {t('bonds.inflation_rate')} (%)
            </Label>
            <Input
              id="expectedInflation"
              type="number"
              step="0.1"
              className="h-10"
              value={inputs.expectedInflation}
              onChange={(e) => onUpdate('expectedInflation', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="margin" className="text-xs font-semibold uppercase text-muted-foreground">
              {t('bonds.margin')} (%)
            </Label>
            <Input
              id="margin"
              type="number"
              step="0.01"
              className="h-10"
              value={inputs.margin}
              onChange={(e) => onUpdate('margin', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Tax */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">{t('bonds.custom_tax_rate')}</Label>
              <p className="text-[10px] text-muted-foreground">
                {t('bonds.belka_tax_desc')}
              </p>
            </div>
            <Switch
              checked={showCustomTax}
              onCheckedChange={setShowCustomTax}
            />
          </div>

          {showCustomTax && (
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-xs font-semibold uppercase text-muted-foreground">
                {t('bonds.tax_rate')} (%)
              </Label>
              <Input
                id="taxRate"
                type="number"
                className="h-10"
                value={inputs.taxRate}
                onChange={(e) => onUpdate('taxRate', Number(e.target.value))}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
