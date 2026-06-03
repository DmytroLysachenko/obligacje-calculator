'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { History } from 'lucide-react';
import { TaxStrategy, BondType } from '@/features/bond-core/types';
import { ComparisonMaturityMode, IndependentBondComparisonPayload } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import { getDateFnsLocale } from '@/i18n/locale-utils';
import { cn } from '@/lib/utils';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { toDateString } from '@/shared/lib/date-timing';

type SharedConfig = IndependentBondComparisonPayload['sharedConfig'];

const comparisonMaturityModes: ComparisonMaturityMode[] = [
  'reinvest_until_horizon',
  'hold_to_maturity',
  'cash_after_maturity',
  'align_to_shorter_duration',
];

interface ComparisonSharedBaseCardProps {
  sharedConfig: SharedConfig;
  assumptionsBondType: BondType;
  showRealValue: boolean;
  onShowRealValueChange: (value: boolean) => void;
  onUpdateSharedConfig: {
    bivarianceHack: (key: keyof SharedConfig | string, value: unknown) => void;
  }['bivarianceHack'];
}

export function ComparisonSharedBaseCard({
  sharedConfig,
  assumptionsBondType,
  showRealValue,
  onShowRealValueChange,
  onUpdateSharedConfig,
}: ComparisonSharedBaseCardProps) {
  const { t, locale: language } = useAppI18n();
  const activeMaturityMode = sharedConfig.maturityMode ?? 'reinvest_until_horizon';

  return (
    <section className="space-y-6">
      <div className="space-y-2 border-b border-border pb-4">
        <h2 className="ui-section-title">
          {t('comparison.shared_base_title')}
        </h2>
        <p className="ui-body text-muted-foreground">
          {t('comparison.shared_base_desc')}
        </p>
        <p className="ui-metadata leading-5 text-muted-foreground">
          {t('comparison.shared_base_scope')}
        </p>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="ui-metadata text-muted-foreground">
            {t('bonds.timing.mode.label')}
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!sharedConfig.timingMode || sharedConfig.timingMode === 'general' ? 'default' : 'outline'}
              className="h-10 flex-1 text-xs font-semibold"
              onClick={() => onUpdateSharedConfig('timingMode', 'general')}
            >
              {t('bonds.timing.mode.general')}
            </Button>
            <Button
              type="button"
              variant={sharedConfig.timingMode === 'exact' ? 'default' : 'outline'}
              className="h-10 flex-1 text-xs font-semibold"
              onClick={() => onUpdateSharedConfig('timingMode', 'exact')}
            >
              {t('bonds.timing.mode.exact')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="ui-metadata text-muted-foreground">
            {t('comparison.initial_sum')}
          </Label>
          <div className="relative">
            <Input
              type="number"
              className="h-11 rounded-lg pr-12 text-lg font-semibold"
              value={sharedConfig.initialInvestment}
              onChange={(event) => onUpdateSharedConfig('initialInvestment', Number(event.target.value))}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 ui-metadata text-muted-foreground">
              PLN
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-dashed pt-4">
          <div className="space-y-2">
            <Label className="ui-metadata text-muted-foreground">
              {t('bonds.purchase_date')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-11 w-full justify-start text-left font-semibold',
                    !sharedConfig.purchaseDate && 'text-muted-foreground',
                  )}
                >
                  <History className="mr-2 h-4 w-4 text-primary" />
                  {sharedConfig.purchaseDate ? (
                    format(parseISO(sharedConfig.purchaseDate), 'PPP', {
                      locale: getDateFnsLocale(language),
                    })
                  ) : (
                    <span>{t('bonds.pick_date')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  fromYear={2010}
                  toYear={2050}
                  selected={parseISO(sharedConfig.purchaseDate)}
                  onSelect={(date) => date && onUpdateSharedConfig('purchaseDate', toDateString(date))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {sharedConfig.timingMode === 'exact' ? (
            <div className="space-y-2">
              <Label className="ui-metadata text-muted-foreground">
                {t('bonds.withdrawal_date')}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-11 w-full justify-start text-left font-semibold',
                      !sharedConfig.withdrawalDate && 'text-muted-foreground',
                    )}
                  >
                    <History className="mr-2 h-4 w-4 text-primary" />
                    {sharedConfig.withdrawalDate ? (
                      format(parseISO(sharedConfig.withdrawalDate), 'PPP', {
                        locale: getDateFnsLocale(language),
                      })
                    ) : (
                      <span>{t('bonds.pick_date')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    fromYear={2010}
                    toYear={2050}
                    selected={parseISO(sharedConfig.withdrawalDate)}
                    onSelect={(date) => date && onUpdateSharedConfig('withdrawalDate', toDateString(date))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-dashed pt-4">
          <Label className="ui-metadata text-muted-foreground">
            {t('bonds.investment_horizon')}
          </Label>
          <CommittedSliderInput
            value={sharedConfig.investmentHorizonMonths ?? 120}
            min={12}
            max={360}
            step={1}
            unit="mo"
            onCommit={(value) => onUpdateSharedConfig('investmentHorizonMonths', value)}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            {t('comparison.shared_horizon_desc')}
          </p>
        </div>

        <div className="space-y-4 border-t border-border pt-5">
          <div className="space-y-1">
            <Label className="ui-metadata text-muted-foreground">
              {t('comparison.maturity_mode.label')}
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('comparison.maturity_mode.description')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {comparisonMaturityModes.map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={activeMaturityMode === mode ? 'default' : 'outline'}
                className="h-auto justify-start px-3 py-3 text-left"
                aria-pressed={activeMaturityMode === mode}
                onClick={() => onUpdateSharedConfig('maturityMode', mode)}
              >
                <span className="space-y-1">
                  <span className="block text-xs font-semibold">
                    {t(`comparison.maturity_mode.${mode}.label`)}
                  </span>
                  <span className="block text-xs font-normal leading-5 opacity-80">
                    {t(`comparison.maturity_mode.${mode}.description`)}
                  </span>
                </span>
              </Button>
            ))}
          </div>
          <div className="border-l-2 border-border bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold text-foreground">
              {t('comparison.fairness.mode_label')}: {t(`comparison.maturity_mode.${activeMaturityMode}.label`)}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t(`comparison.maturity_mode.${activeMaturityMode}.description`)}
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-dashed pt-4">
          <MarketAssumptionsForm
            expectedInflation={sharedConfig.expectedInflation}
            expectedNbpRate={sharedConfig.expectedNbpRate}
            customInflation={sharedConfig.customInflation}
            customNbpRate={sharedConfig.customNbpRate}
            bondType={assumptionsBondType}
            inflationHorizonYears={Math.max(1, Math.ceil((sharedConfig.investmentHorizonMonths ?? 120) / 12))}
            onUpdate={onUpdateSharedConfig}
            compact
          />
        </div>

        <div className="space-y-2 border-t border-dashed pt-4">
          <Label className="ui-metadata text-muted-foreground">
            {t('bonds.tax_strategy')}
          </Label>
          <Select
            value={sharedConfig.taxStrategy ?? TaxStrategy.STANDARD}
            onValueChange={(value) => onUpdateSharedConfig('taxStrategy', value as TaxStrategy)}
          >
            <SelectTrigger className="h-11 [&>span]:truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaxStrategy.STANDARD}>{t('bonds.tax_standard')}</SelectItem>
              <SelectItem value={TaxStrategy.IKE}>{t('bonds.tax_ike')}</SelectItem>
              <SelectItem value={TaxStrategy.IKZE}>{t('bonds.tax_ikze')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs leading-5 text-muted-foreground">
            {t('comparison.shared_tax_desc')}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/35 p-3">
          <div>
            <p className="text-sm font-semibold">{t('bonds.inflation.adjusted')}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('bonds.show_purchasing_power')}
            </p>
          </div>
          <Switch checked={showRealValue} onCheckedChange={onShowRealValueChange} />
        </div>
      </div>
    </section>
  );
}
