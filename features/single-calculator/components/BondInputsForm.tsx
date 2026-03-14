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
import { BondType, BondInputs } from '../../bond-core/types';
import { useLanguage } from '@/i18n';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { AlertCircle, CalendarIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addMonths } from 'date-fns';
import { pl, enGB } from 'date-fns/locale';

interface BondInputsFormProps {
  inputs: BondInputs;
  onUpdate: (key: keyof BondInputs, value: string | number | boolean) => void;
  onBondTypeChange: (type: BondType) => void;
}

export const BondInputsForm: React.FC<BondInputsFormProps> = ({
  inputs,
  onUpdate,
  onBondTypeChange,
}) => {
  const { t, language } = useLanguage();
  const [showCustomTax, setShowCustomTax] = useState(false);
  const currentDef = BOND_DEFINITIONS[inputs.bondType];
  const dateLocale = language === 'pl' ? pl : enGB;

  const handleInvestmentChange = (value: string) => {
    const numValue = Number(value);
    onUpdate('initialInvestment', numValue);
  };

  const isDivisibleBy100 = inputs.initialInvestment % 100 === 0 && inputs.initialInvestment > 0;
  const maturityDate = addMonths(parseISO(inputs.purchaseDate), Math.round(inputs.duration * 12));

  return (
    <Card className="w-full shadow-lg border-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{t('bonds.single_calculator')}</CardTitle>
        </div>
        <CardDescription>
          {t('bonds.bond_type_selection')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bond Type Selection */}
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

        {/* Investment Amount */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="initialInvestment" className="font-semibold">
              {t('bonds.initial_investment')}
            </Label>
            <span className="text-xs font-medium text-muted-foreground">
              {Math.floor(inputs.initialInvestment / 100)} {t('bonds.units')}
            </span>
          </div>
          <div className="relative">
            <Input
              id="initialInvestment"
              type="number"
              className={cn(
                "h-11 pl-4 pr-12 text-lg font-medium",
                !isDivisibleBy100 && "border-destructive focus-visible:ring-destructive"
              )}
              value={inputs.initialInvestment}
              onChange={(e) => handleInvestmentChange(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              PLN
            </div>
          </div>
          {!isDivisibleBy100 && inputs.initialInvestment > 0 && (
            <div className="flex items-center gap-2 text-destructive text-xs font-medium animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-3 w-3" />
              <span>{t('bonds.error_100_pln')}</span>
            </div>
          )}
        </div>

        {/* Dates Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              {t('bonds.purchase_date')}
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

        <Separator />

        {/* Tax Switch */}
        <div className="space-y-4">
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
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
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

        {/* Summary Details */}
        <div className="pt-2">
          <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg border border-dashed">
            <div className="flex justify-between">
              <span>{t('bonds.duration')}:</span>
              <span className="font-bold">{inputs.duration} {t('common.years')}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('bonds.first_year_rate')}:</span>
              <span className="font-bold">{inputs.firstYearRate}%</span>
            </div>
            <div className="flex justify-between">
              <span>{t('bonds.maturity_date')}:</span>
              <span className="font-bold">{format(maturityDate, 'PPP', { locale: dateLocale })}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('bonds.payout_type')}:</span>
              <span className="font-bold">
                {inputs.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('bonds.early_withdrawal_fee')}:</span>
              <span className="font-bold">{inputs.earlyWithdrawalFee} PLN</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
