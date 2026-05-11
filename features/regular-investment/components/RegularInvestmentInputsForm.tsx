'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { enGB, pl } from 'date-fns/locale';
import {
  AlertCircle,
  CalendarIcon,
  Info,
  Settings2,
  Target,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BondType,
  InvestmentFrequency,
  RegularInvestmentInputs,
  TaxStrategy,
} from '../../bond-core/types';
import {
  getBondSupportMeta,
  isFamilyBondType,
} from '../../bond-core/support-matrix';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { getHorizonMonths, toDateString } from '@/shared/lib/date-timing';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';

interface RegularInvestmentInputsFormProps {
  inputs: RegularInvestmentInputs;
  onUpdate: {
    bivarianceHack: (
      key: keyof RegularInvestmentInputs | string,
      value: unknown,
    ) => void;
  }['bivarianceHack'];
  onBondTypeChange: (type: BondType) => void;
}

const SectionHeading = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="space-y-1">
    <h3 className="text-sm font-semibold tracking-[0.08em] text-slate-700">
      {title}
    </h3>
    <p className="text-[15px] leading-7 text-muted-foreground">{description}</p>
  </div>
);

export const RegularInvestmentInputsForm: React.FC<RegularInvestmentInputsFormProps> =
  React.memo(({ inputs, onUpdate, onBondTypeChange }) => {
    const { t, language } = useLanguage();
    const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
    const [showCustomTax, setShowCustomTax] = useState(false);

    if (isLoadingDefs || !definitions) {
      return (
        <Card className="w-full border-primary/10 shadow-sm">
          <CardContent className="flex h-[600px] items-center justify-center">
            <p className="text-base font-semibold tracking-[0.08em] text-muted-foreground">
              {t('common.loading')}
            </p>
          </CardContent>
        </Card>
      );
    }

    const currentDef = definitions[inputs.bondType];
    const currentBondSupport = getBondSupportMeta(inputs.bondType);
    const dateLocale = language === 'pl' ? pl : enGB;
    const investmentHorizonMonths =
      inputs.investmentHorizonMonths ??
      getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);
    const investmentHorizonYears = Math.max(1 / 12, investmentHorizonMonths / 12);
    const isDivisibleBy100 =
      inputs.contributionAmount % 100 === 0 && inputs.contributionAmount > 0;

    return (
      <Card className="w-full border-primary/10 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-[1.65rem] font-black tracking-tight">{t('bonds.regular_calculator')}</CardTitle>
          <CardDescription className="text-[15px] leading-7">
            Main contribution plan first. Advanced assumptions stay collapsed until needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          <section className="space-y-6">
            <SectionHeading
              title="Core plan"
              description="Set savings goal, bond type, tax wrapper, and repeating contribution amount."
            />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                  <Label className="flex items-center gap-2 text-[15px] font-semibold">
                  <Target className="h-4 w-4 text-primary" />
                  {t('bonds.savings_goal_opt')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('bonds.savings_goal_opt')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={t('bonds.example_goal')}
                  className="h-11 pl-4 pr-12"
                  value={inputs.savingsGoal || ''}
                  onChange={(e) =>
                    onUpdate(
                      'savingsGoal',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  PLN
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="bondType" className="text-[15px] font-semibold">
                  {t('bonds.bond.type')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('bonds.bond.type_selection')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={inputs.bondType}
                onValueChange={(value) => onBondTypeChange(value as BondType)}
              >
                <SelectTrigger id="bondType" className="h-11">
                  <SelectValue placeholder={t('bonds.select_bond_type')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BondType).map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{type}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em]',
                              getBondSupportMeta(type).tone === 'caution'
                                ? 'bg-amber-100 text-amber-800'
                                : getBondSupportMeta(type).tone === 'limited'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-700',
                            )}
                          >
                            {getBondSupportMeta(type).shortLabel}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {definitions[type]?.fullName[language] || type}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2 rounded-lg border border-primary/5 bg-muted/50 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Info className="h-3 w-3" />
                  <span>{currentDef.fullName[language]}</span>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  {currentDef.description[language]}
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  {currentBondSupport.description}
                </p>
                {isFamilyBondType(inputs.bondType) ? (
                  <p className="font-semibold text-amber-700">
                    Family-bond scenarios are only meaningful if the household eligibility condition really applies.
                  </p>
                ) : null}
              </div>
            </div>

            <Separator />

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
              <Select
                value={inputs.taxStrategy}
                onValueChange={(value) =>
                  onUpdate('taxStrategy', value as TaxStrategy)
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <Separator />

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
                  <span className="text-sm font-bold text-primary">
                    {inputs.contributionAmount} PLN
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      id="contributionAmount"
                      type="number"
                      className={cn(
                        'h-11 pl-4 pr-12 text-lg font-medium',
                        !isDivisibleBy100 &&
                          'border-destructive focus-visible:ring-destructive',
                      )}
                      value={inputs.contributionAmount}
                      onChange={(e) =>
                        onUpdate('contributionAmount', Number(e.target.value))
                      }
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      PLN
                    </div>
                  </div>
                  <CommittedSliderInput
                    value={inputs.contributionAmount}
                    min={100}
                    max={20000}
                    step={100}
                    unit="PLN"
                    onCommit={(value) => onUpdate('contributionAmount', value)}
                  />
                </div>
                {!isDivisibleBy100 && inputs.contributionAmount > 0 ? (
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
                <Select
                  value={inputs.frequency}
                  onValueChange={(value) =>
                    onUpdate('frequency', value as InvestmentFrequency)
                  }
                >
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

          <section className="space-y-6 border-t border-dashed pt-6">
            <SectionHeading
              title="Timing"
              description="Choose general horizon mode or exact dates, then define the full contribution window."
            />

            <div className="space-y-3">
              <Label className="text-[15px] font-semibold">{t('bonds.timing.mode.label')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={inputs.timingMode === 'general' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => onUpdate('timingMode', 'general')}
                >
                  {t('bonds.timing.mode.general')}
                </Button>
                <Button
                  type="button"
                  variant={inputs.timingMode === 'exact' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => onUpdate('timingMode', 'exact')}
                >
                  {t('bonds.timing.mode.exact')}
                </Button>
              </div>
            </div>

            <div
              className={cn(
                'grid gap-4',
                inputs.timingMode === 'exact'
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1',
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-muted-foreground">
                    {t('bonds.purchase_date')}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{t('regular_form.start_date_help')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-11 w-full justify-start px-3 text-left text-[15px] font-normal',
                        !inputs.purchaseDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {inputs.purchaseDate ? (
                        format(parseISO(inputs.purchaseDate), 'PPP', {
                          locale: dateLocale,
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
                      selected={parseISO(inputs.purchaseDate)}
                      onSelect={(date) =>
                        date && onUpdate('purchaseDate', toDateString(date))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {inputs.timingMode === 'exact' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      {t('bonds.withdrawal_date')}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {t('regular_form.withdrawal_date_help')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-11 w-full justify-start px-3 text-left text-[15px] font-normal',
                          !inputs.withdrawalDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {inputs.withdrawalDate ? (
                          format(parseISO(inputs.withdrawalDate), 'PPP', {
                            locale: dateLocale,
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
                        selected={parseISO(inputs.withdrawalDate)}
                        onSelect={(date) =>
                          date && onUpdate('withdrawalDate', toDateString(date))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="investmentHorizonMonths"
                  className="font-semibold"
                >
                  {t('bonds.investment_horizon')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('regular_form.horizon_help')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {inputs.timingMode === 'exact' ? (
                <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {investmentHorizonYears % 1 === 0
                      ? investmentHorizonYears.toFixed(0)
                      : investmentHorizonYears.toFixed(2)}{' '}
                    {t('common.years')}
                  </span>{' '}
                  · {t('regular_form.horizon_help')}
                </div>
              ) : (
                <CommittedSliderInput
                  value={investmentHorizonYears}
                  min={1}
                  max={30}
                  step={1}
                  unit="Y"
                  onCommit={(value) =>
                    onUpdate('investmentHorizonMonths', value * 12)
                  }
                />
              )}
            </div>
          </section>

          <section className="border-t border-dashed pt-6">
            <Accordion type="single" collapsible defaultValue="">
              <AccordionItem value="advanced" className="border-none">
                <AccordionTrigger className="rounded-2xl border bg-slate-50 px-4 py-4 hover:no-underline">
                  <div className="flex items-start gap-3 text-left">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Settings2 className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold tracking-[0.08em] text-slate-700">
                        {t('common.advanced')}
                      </h3>
                      <p className="text-[15px] leading-7 text-muted-foreground">
                        Inflation assumptions, rollover behavior, rebuy logic, custom tax, and chart display.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    <MarketAssumptionsForm
                      expectedInflation={inputs.expectedInflation}
                      expectedNbpRate={inputs.expectedNbpRate}
                      bondType={inputs.bondType}
                      customInflation={inputs.customInflation}
                      onUpdate={onUpdate}
                      compact
                    />

                    {currentDef.rebuyDiscount > 0 ? (
                      <div className="space-y-4 border-t border-dashed pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-semibold">
                                {t('bonds.is_rebought')}
                              </Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">{t('regular_form.rebuy_help')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('bonds.is_rebought_desc')} (-{currentDef.rebuyDiscount.toFixed(2)} PLN/szt)
                            </p>
                          </div>
                          <Switch
                            checked={inputs.isRebought}
                            onCheckedChange={(checked) =>
                              onUpdate('isRebought', checked)
                            }
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-4 border-t border-dashed pt-6">
                      <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold text-primary">
                            {t('bonds.reinvest')}
                          </Label>
                          <p className="text-xs font-medium italic text-muted-foreground">
                            {t('bonds.rollover_desc')}
                          </p>
                        </div>
                        <Switch
                          checked={!!inputs.rollover}
                          onCheckedChange={(checked) =>
                            onUpdate('rollover', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-semibold">
                              {t('bonds.custom_tax_rate')}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{t('regular_form.tax_help')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('bonds.belka_tax_desc')}
                          </p>
                        </div>
                        <Switch
                          checked={showCustomTax}
                          onCheckedChange={setShowCustomTax}
                        />
                      </div>

                      {showCustomTax ? (
                        <div className="space-y-2">
                          <Label
                            htmlFor="taxRate"
                            className="text-sm font-semibold text-muted-foreground"
                          >
                            {t('bonds.tax_rate')} (%)
                          </Label>
                          <Input
                            id="taxRate"
                            type="number"
                            className="h-10"
                            value={inputs.taxRate}
                            onChange={(e) =>
                              onUpdate('taxRate', Number(e.target.value))
                            }
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4 border-t border-dashed pt-6">
                      <Label className="text-sm font-semibold text-muted-foreground">
                        {t('bonds.chart.granularity')}
                      </Label>
                      <div className="flex gap-1 rounded-xl border bg-muted/50 p-1">
                        {(['monthly', 'quarterly', 'yearly'] as const).map((step) => (
                          <Button
                            key={step}
                            type="button"
                            variant={
                              inputs.chartStep === step ||
                              (!inputs.chartStep && step === 'quarterly')
                                ? 'default'
                                : 'ghost'
                            }
                            className={cn(
                              'h-9 flex-1 text-[12px] font-semibold tracking-[0.08em] transition-all',
                              (inputs.chartStep === step ||
                                (!inputs.chartStep && step === 'quarterly')) &&
                                'shadow-sm',
                            )}
                            onClick={() => onUpdate('chartStep', step)}
                          >
                            {t(`bonds.chart.periods.${step}`)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <div className="pt-2">
            <div className="space-y-1.5 rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('bonds.duration')}:</span>
                <span className="font-bold">
                  {formatBondDuration(inputs.duration, language)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  {inputs.bondType === 'OTS'
                    ? t('bonds.yield_three_months')
                    : inputs.bondType === 'ROR' || inputs.bondType === 'DOR'
                      ? t('bonds.first_month_rate')
                      : t('bonds.first_year_rate')}
                  :
                </span>
                <span className="font-bold">{inputs.firstYearRate}%</span>
              </div>
              {currentDef.margin > 0 ? (
                <div className="flex justify-between">
                  <span>{t('bonds.margin')}:</span>
                  <span className="font-bold">{inputs.margin}%</span>
                </div>
              ) : null}
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
  });

RegularInvestmentInputsForm.displayName = 'RegularInvestmentInputsForm';
