'use client';
import React from 'react';
import { ArrowRight, Scale } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { YearlyTimelinePoint } from '@/features/bond-core/types';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import {
  AppLanguage,
  getRateSourceDisplayLabel,
  getReferenceDisplayLabel,
} from '@/shared/lib/bond-display';
interface CalculationAuditTraceProps {
  point: YearlyTimelinePoint;
}
function AuditRow({
  label,
  value,
  tone = 'text-foreground',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-border py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold', tone)}>{value}</span>
    </div>
  );
}
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
export const CalculationAuditTrace: React.FC<CalculationAuditTraceProps> = ({ point }) => {
  const { t, locale: language } = useAppI18n();
  const currencyFormatter = useCurrencyFormatter(language);
  const formatCurrency = (value: number) => currencyFormatter.format(value);
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  const rateLabel = getRateSourceDisplayLabel(point.rateSource, language as AppLanguage);
  const referenceLabel = getReferenceDisplayLabel(point, language as AppLanguage);
  return (
    <section className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Scale className="h-3.5 w-3.5 text-foreground" />
            {t('bonds.audit.eyebrow')}
          </div>
          <h3 className="ui-section-title">
            {t('bonds.audit.title', { period: point.periodLabel })}
          </h3>
          <p className="ui-body max-w-3xl text-muted-foreground">{t('bonds.audit.description')}</p>
        </div>

        <div className="ui-divider-group">
          <AuditRow
            label={t('bonds.base_value')}
            value={formatCurrency(point.nominalValueBeforeInterest)}
          />
          <AuditRow label={t('common.interest_rate')} value={formatPercent(point.interestRate)} />
          <AuditRow label={t('bonds.audit.rate_source')} value={rateLabel} />
          {referenceLabel ? (
            <AuditRow label={t('bonds.audit.reference_basis')} value={referenceLabel} />
          ) : null}
          <AuditRow
            label={t('bonds.plus_interest')}
            value={`+${formatCurrency(point.interestEarned)}`}
            tone="text-success"
          />
          {point.taxDeducted > 0 ? (
            <AuditRow
              label={t('bonds.minus_tax')}
              value={`-${formatCurrency(point.taxDeducted)}`}
              tone="text-warning"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between bg-muted/35 px-4 py-4">
          <div>
            <p className="ui-meta font-semibold uppercase tracking-[0.12em]">
              {t('bonds.net_period_gain')}
            </p>
            <p className="mt-2 ui-large-metric">{formatCurrency(point.netInterest)}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
};
