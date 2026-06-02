'use client';

import React from 'react';
import {
  AlertTriangle,
  DatabaseZap,
  FileText,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';

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
        <p className="ui-meta font-semibold">
          {title}
        </p>
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

function humanizeFlag(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
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

  const freshnessTone =
    dataFreshness?.status === 'fresh'
      ? 'border-[var(--finance-success)] text-foreground'
      : 'border-[var(--finance-warning)] text-foreground';

  return (
    <div className="space-y-6">
      {dataFreshness ? (
        <div className={`border-l-2 px-4 py-2 text-sm leading-6 ${freshnessTone}`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  dataFreshness.status === 'fresh'
                    ? 'bg-[var(--finance-success)]'
                    : 'bg-[var(--finance-warning)]'
                }`}
              />
              <span>{t('comparison.freshness_status')}:</span>
              <span>{t(`comparison.status_${dataFreshness.status}`)}</span>
            </div>
            {dataFreshness.asOf ? (
              <div>
                {t('economic.as_of')}: <span className="font-semibold">{dataFreshness.asOf}</span>
              </div>
            ) : null}
            {dataFreshness.usedFallback ? (
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
          items={warnings}
          icon={<AlertTriangle className="h-4 w-4" />}
          className="space-y-3 border-t border-[var(--finance-warning)]/45 pt-4 text-foreground"
        />
        <MetaSection
          title={t('common.assumptions')}
          items={assumptions}
          icon={<Target className="h-4 w-4" />}
          className="space-y-3 border-t border-border pt-4 text-foreground"
        />
        <MetaSection
          title={t('common.notes')}
          items={calculationNotes}
          icon={<FileText className="h-4 w-4" />}
          className="space-y-3 border-t border-border pt-4 text-foreground"
        />
        <MetaSection
          title={t('common.data_quality')}
          items={dataQualityFlags}
          icon={<ShieldAlert className="h-4 w-4" />}
          className="space-y-3 border-t border-[var(--finance-warning)]/45 pt-4 text-foreground"
          formatItem={humanizeFlag}
        />
      </div>

      <div className="flex flex-col gap-3 border-y border-border py-4 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <DatabaseZap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">
            {t('common.calculation_audit')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{t('comparison.live_calculation')}</span>
          <span>
            {t('common.engine_version')}: <span className="font-semibold text-foreground">{calculationVersion}</span>
          </span>
        </div>
      </div>
    </div>
  );
};




