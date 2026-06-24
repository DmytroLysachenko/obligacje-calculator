'use client';

import { AlertTriangle, DatabaseZap, FileText, ShieldAlert, Target } from 'lucide-react';
import React from 'react';

import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import { getCalculationFreshnessMetaState } from '@/shared/lib/data-freshness-display';

interface CalculationMetaPanelProps {
  warnings?: string[];
  assumptions?: string[];
  calculationNotes?: string[];
  dataQualityFlags?: string[];
  dataFreshness?: CalculationDataFreshness;
  calculationVersion?: string;
  compact?: boolean;
}

const MetaSection = ({
  title,
  icon,
  items,
  className,
  formatItem,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  className: string;
  formatItem?: (item: string) => string;
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="ui-meta font-semibold">{title}</p>
      </div>
      <ul className="divide-y divide-dashed divide-current/15 text-sm leading-6">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="px-0 py-2.5 first:pt-0 last:pb-0">
            {formatItem ? formatItem(item) : item}
          </li>
        ))}
      </ul>
    </section>
  );
};

function humanizeFlag(
  value: string,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const knownFlag = t(`bonds.data_quality_flags.${value}`);

  if (knownFlag && knownFlag !== `bonds.data_quality_flags.${value}`) {
    return knownFlag;
  }

  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function translateEngineMessage(
  value: string,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const numericValue = value.match(/-?\d+(?:\.\d+)?/)?.[0];

  if (value.startsWith('Expected annual inflation:')) {
    return t('bonds.engine_messages.expected_inflation', { value: numericValue ?? '' });
  }

  if (value.startsWith('Expected NBP reference rate:')) {
    return t('bonds.engine_messages.expected_nbp_rate', { value: numericValue ?? '' });
  }

  if (value === 'Using custom user-supplied inflation overrides.') {
    return t('bonds.engine_messages.custom_inflation');
  }

  if (value === 'Using custom user-supplied NBP rate overrides.') {
    return t('bonds.engine_messages.custom_nbp');
  }

  if (value === 'Inflation history is missing; projected assumptions may be used.') {
    return t('bonds.engine_messages.missing_inflation_history');
  }

  if (value === 'NBP rate history is missing; projected assumptions may be used.') {
    return t('bonds.engine_messages.missing_nbp_history');
  }

  if (value === 'Historical data was unavailable; projected assumptions may be used.') {
    return t('bonds.engine_messages.missing_history');
  }

  if (
    value ===
    'Rollover is disabled; the simulation stops at the first bond cycle or selected withdrawal date.'
  ) {
    return t('bonds.engine_messages.rollover_disabled');
  }

  if (value === 'Early redemption fee logic was applied before the native maturity date.') {
    return t('bonds.engine_messages.early_redemption_applied');
  }

  const cycleMatch = value.match(
    /^Simulation covered (\d+) bond cycles? across the selected horizon\.$/,
  );
  if (cycleMatch) {
    return t('bonds.engine_messages.rollover_cycles', { count: cycleMatch[1] });
  }

  return value;
}

export const CalculationMetaPanel: React.FC<CalculationMetaPanelProps> = ({
  warnings = [],
  assumptions = [],
  calculationNotes = [],
  dataQualityFlags = [],
  dataFreshness,
  calculationVersion = 'v1.2.0',
  compact = false,
}) => {
  const { t } = useAppI18n();

  const hasContent =
    warnings.length > 0 ||
    assumptions.length > 0 ||
    calculationNotes.length > 0 ||
    dataQualityFlags.length > 0 ||
    Boolean(dataFreshness);

  if (!hasContent) {
    return null;
  }

  const freshnessMeta = dataFreshness ? getCalculationFreshnessMetaState(dataFreshness) : null;

  return (
    <div className="space-y-5">
      {freshnessMeta ? (
        <div className={`border-l-2 px-4 py-3 text-sm leading-6 ${freshnessMeta?.toneClass}`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <span className={`h-2.5 w-2.5 rounded-full ${freshnessMeta?.dotClass}`} />
              <span>{t('comparison.freshness_status')}:</span>
              <span>{t(`comparison.status_${freshnessMeta.status}`)}</span>
            </div>
            {freshnessMeta?.coverageLabel ? (
              <div>
                {t('common.coverage')}:{' '}
                <span className="font-semibold">{freshnessMeta.coverageLabel}</span>
              </div>
            ) : null}
            {freshnessMeta?.lastSyncLabel ? (
              <div>
                {t('admin.inventory.cols.last_sync')}:{' '}
                <span className="font-semibold">{freshnessMeta.lastSyncLabel}</span>
              </div>
            ) : null}
            {freshnessMeta?.usedFallback ? (
              <div className="font-semibold">{t('comparison.fallback_used')}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={`grid grid-cols-1 gap-x-6 gap-y-5 ${
          compact ? 'xl:grid-cols-2' : 'md:grid-cols-2'
        }`}
      >
        <MetaSection
          title={t('common.warnings')}
          items={warnings.map((item) => translateEngineMessage(item, t))}
          icon={<AlertTriangle className="h-4 w-4" />}
          className="space-y-3 border-t border-warning/40 py-4 text-foreground"
        />
        <MetaSection
          title={t('common.assumptions')}
          items={assumptions.map((item) => translateEngineMessage(item, t))}
          icon={<Target className="h-4 w-4" />}
          className="space-y-3 border-t border-border py-4 text-foreground"
        />
        <MetaSection
          title={t('common.notes')}
          items={calculationNotes.map((item) => translateEngineMessage(item, t))}
          icon={<FileText className="h-4 w-4" />}
          className="space-y-3 border-t border-border py-4 text-foreground"
        />
        <MetaSection
          title={t('common.data_quality')}
          items={dataQualityFlags}
          icon={<ShieldAlert className="h-4 w-4" />}
          className="space-y-3 border-t border-warning/40 py-4 text-foreground"
          formatItem={(item) => humanizeFlag(item, t)}
        />
      </div>

      <div className="flex flex-col gap-3 border-y border-border py-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <DatabaseZap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{t('common.calculation_audit')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{t('comparison.live_calculation')}</span>
          <span>
            {t('common.engine_version')}:{' '}
            <span className="font-semibold text-foreground">{calculationVersion}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
