'use client';

import React from 'react';
import { type Locale, format, parseISO } from 'date-fns';
import { CalendarIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { cn } from '@/lib/utils';
import { toDateString } from '@/shared/lib/date-timing';
import { SectionHeading } from './SectionHeading';

type TimingSectionProps = {
  timingMode?: 'general' | 'exact';
  purchaseDate: string;
  withdrawalDate: string;
  investmentHorizonYears: number;
  dateLocale: Locale;
  onUpdate: (key: string, value: unknown) => void;
  t: (key: string) => string;
};

export function TimingSection({
  timingMode,
  purchaseDate,
  withdrawalDate,
  investmentHorizonYears,
  dateLocale,
  onUpdate,
  t,
}: TimingSectionProps) {
  return (
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
            variant={timingMode === 'general' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate('timingMode', 'general')}
          >
            {t('bonds.timing.mode.general')}
          </Button>
          <Button
            type="button"
            variant={timingMode === 'exact' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onUpdate('timingMode', 'exact')}
          >
            {t('bonds.timing.mode.exact')}
          </Button>
        </div>
      </div>

      <div className={cn('grid gap-4', timingMode === 'exact' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
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
                  !purchaseDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {purchaseDate ? (
                  format(parseISO(purchaseDate), 'PPP', { locale: dateLocale })
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
                selected={parseISO(purchaseDate)}
                onSelect={(date) => date && onUpdate('purchaseDate', toDateString(date))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {timingMode === 'exact' ? (
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
                    <p className="text-xs">{t('regular_form.withdrawal_date_help')}</p>
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
                    !withdrawalDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {withdrawalDate ? (
                    format(parseISO(withdrawalDate), 'PPP', { locale: dateLocale })
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
                  selected={parseISO(withdrawalDate)}
                  onSelect={(date) => date && onUpdate('withdrawalDate', toDateString(date))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="investmentHorizonMonths" className="font-semibold">
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

        {timingMode === 'exact' ? (
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
            onCommit={(value) => onUpdate('investmentHorizonMonths', value * 12)}
          />
        )}
      </div>
    </section>
  );
}
