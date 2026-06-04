'use client';

import React from 'react';
import { type Locale, format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toDateString } from '@/shared/lib/date-timing';
import { FormField } from '@/shared/components/forms/FormField';
import { RangeField } from '@/shared/components/forms/RangeField';
import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';

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
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-[15px] font-semibold">{t('bonds.timing.mode.label')}</p>
        <SegmentedControl
          value={timingMode ?? 'general'}
          options={[
            { value: 'general', label: t('bonds.timing.mode.general') },
            { value: 'exact', label: t('bonds.timing.mode.exact') },
          ]}
          onValueChange={(value) => onUpdate('timingMode', value)}
        />
      </div>

      <div className={cn('grid gap-4', timingMode === 'exact' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
        <FormField
          label={t('bonds.purchase_date')}
          tooltip={t('regular_form.start_date_help')}
          labelClassName="text-muted-foreground"
        >
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
        </FormField>

        {timingMode === 'exact' ? (
          <FormField
            label={t('bonds.withdrawal_date')}
            tooltip={t('regular_form.withdrawal_date_help')}
            labelClassName="text-muted-foreground"
          >
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
          </FormField>
        ) : null}
      </div>

      {timingMode === 'exact' ? (
        <FormField label={t('bonds.investment_horizon')} tooltip={t('regular_form.horizon_help')}>
          <div className="rounded-lg border border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {investmentHorizonYears % 1 === 0
                ? investmentHorizonYears.toFixed(0)
                : investmentHorizonYears.toFixed(2)}{' '}
              {t('common.years')}
            </span>{' '}
            - {t('regular_form.horizon_help')}
          </div>
        </FormField>
      ) : (
        <RangeField
          label={t('bonds.investment_horizon')}
          tooltip={t('regular_form.horizon_help')}
          value={investmentHorizonYears}
          min={1}
          max={30}
          step={1}
          unit="Y"
          onCommit={(value) => onUpdate('investmentHorizonMonths', value * 12)}
        />
      )}
    </div>
  );
}
