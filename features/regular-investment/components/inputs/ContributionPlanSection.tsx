'use client';

import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InvestmentFrequency, TaxStrategy } from '@/features/bond-core/types';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';

type ContributionPlanSectionProps = {
  contributionAmount: number;
  frequency: InvestmentFrequency;
  taxStrategy: TaxStrategy;
  isDivisibleBy100: boolean;
  onUpdate: (key: string, value: unknown) => void;
  t: (key: string) => string;
};

export function ContributionPlanSection({
  contributionAmount,
  frequency,
  taxStrategy,
  isDivisibleBy100,
  onUpdate,
  t,
}: ContributionPlanSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-[15px] font-semibold">{t('bonds.tax_strategy')}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('bonds.tax_strategy')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant="secondary" className="text-[11px] font-medium">
            {t('comparison.configuration')}
          </Badge>
        </div>
        <Select value={taxStrategy} onValueChange={(value) => onUpdate('taxStrategy', value as TaxStrategy)}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TaxStrategy.STANDARD}>{t('bonds.tax_standard')}</SelectItem>
            <SelectItem value={TaxStrategy.IKE}>{t('bonds.tax_ike')}</SelectItem>
            <SelectItem value={TaxStrategy.IKZE}>{t('bonds.tax_ikze')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="contributionAmount" className="text-[15px] font-semibold">
                {t('bonds.monthly_investment')}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{t('regular_form.contribution_help')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm font-bold text-primary">{contributionAmount} PLN</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input
                id="contributionAmount"
                type="number"
                className={`h-11 pl-4 pr-12 text-lg font-medium ${
                  !isDivisibleBy100 ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
                value={contributionAmount}
                onChange={(e) => onUpdate('contributionAmount', Number(e.target.value))}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                PLN
              </div>
            </div>
            <CommittedSliderInput
              value={contributionAmount}
              min={100}
              max={20000}
              step={100}
              unit="PLN"
              onCommit={(value) => onUpdate('contributionAmount', value)}
            />
          </div>
          {!isDivisibleBy100 && contributionAmount > 0 ? (
            <div className="flex items-center gap-2 text-xs font-medium text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{t('bonds.error_100_pln')}</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="frequency" className="text-[15px] font-semibold">
              {t('bonds.frequency.label')}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('regular_form.frequency_help')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={frequency} onValueChange={(value) => onUpdate('frequency', value as InvestmentFrequency)}>
            <SelectTrigger id="frequency" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(InvestmentFrequency).map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {t(`bonds.frequency.${freq.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
