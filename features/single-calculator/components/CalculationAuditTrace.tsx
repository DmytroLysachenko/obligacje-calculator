'use client';

import React from 'react';
import { ArrowRight, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n';
import { YearlyTimelinePoint } from '@/features/bond-core/types';

interface CalculationAuditTraceProps {
  point: YearlyTimelinePoint;
}

function AuditRow({
  label,
  value,
  tone = 'text-slate-950',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={cn('text-sm font-bold', tone)}>{value}</span>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const CalculationAuditTrace: React.FC<CalculationAuditTraceProps> = ({ point }) => {
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const rateLabel =
    point.rateReferenceValue !== undefined || point.rateMarginApplied !== undefined
      ? `${point.rateSource}${
          point.rateReferenceValue !== undefined
            ? ` (${formatPercent(point.rateReferenceValue)} ref)`
            : ''
        }${
          point.rateMarginApplied !== undefined
            ? ` + ${formatPercent(point.rateMarginApplied)} margin`
            : ''
        }`
      : point.rateSource;

  return (
    <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
            <Scale className="h-3.5 w-3.5 text-primary" />
            {language === 'pl' ? 'Szybki audyt okresu' : 'Quick period audit'}
          </div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            {t('bonds.interest_example_title').replace('{{year}}', point.year.toString())}
          </h3>
          <p className="text-sm leading-7 text-slate-600">
            {language === 'pl'
              ? 'To jest skondensowany podglad jednego okresu. Ma pomagac rozumiec skad bierze sie wynik, bez zalewania tabela.'
              : 'This is a condensed view of one period. It should explain where the result comes from without flooding you with table chrome.'}
          </p>
        </div>

        <div className="space-y-3">
          <AuditRow
            label={t('bonds.base_value')}
            value={formatCurrency(point.nominalValueBeforeInterest)}
          />
          <AuditRow
            label={t('common.interest_rate')}
            value={formatPercent(point.interestRate)}
            tone="text-primary"
          />
          <AuditRow
            label={language === 'pl' ? 'Zrodlo stopy' : 'Rate source'}
            value={rateLabel}
          />
          <AuditRow
            label={t('bonds.plus_interest')}
            value={`+${formatCurrency(point.interestEarned)}`}
            tone="text-emerald-700"
          />
          {point.taxDeducted > 0 ? (
            <AuditRow
              label={t('bonds.minus_tax')}
              value={`-${formatCurrency(point.taxDeducted)}`}
              tone="text-orange-700"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              {t('bonds.net_period_gain')}
            </p>
            <p className="mt-2 text-xl font-black text-primary">
              {formatCurrency(point.netInterest)}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
};
