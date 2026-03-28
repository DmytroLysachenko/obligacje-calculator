'use client';

import React from 'react';
import { AlertTriangle, DatabaseZap, FileText, ShieldAlert, Target } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';

interface CalculationMetaPanelProps {
  warnings?: string[];
  assumptions?: string[];
  calculationNotes?: string[];
  dataQualityFlags?: string[];
  dataFreshness?: CalculationDataFreshness;
  compact?: boolean;
}

const MetaCard = ({
  title,
  icon,
  items,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  className: string;
}) => {
  if (!items.length) {
    return null;
  }

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm ${className}`}>
      <h4 className="mb-2 flex items-center gap-2 text-xs font-black uppercase">
        {icon}
        {title}
      </h4>
      <ul className="list-inside list-disc space-y-1 text-xs">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export const CalculationMetaPanel: React.FC<CalculationMetaPanelProps> = ({
  warnings = [],
  assumptions = [],
  calculationNotes = [],
  dataQualityFlags = [],
  dataFreshness,
  compact = false,
}) => {
  const { t } = useLanguage();

  const hasContent =
    warnings.length > 0
    || assumptions.length > 0
    || calculationNotes.length > 0
    || dataQualityFlags.length > 0
    || Boolean(dataFreshness);

  if (!hasContent) {
    return null;
  }

  return (
    <div className="space-y-4">
      {dataFreshness ? (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-bold">{t('comparison.freshness_status')}:</span>{' '}
          {t(`comparison.status_${dataFreshness.status}`)}
          {dataFreshness.asOf ? ` | ${t('economic.as_of')}: ${dataFreshness.asOf}` : ''}
          {dataFreshness.usedFallback ? ` | ${t('comparison.fallback_used')}` : ''}
        </div>
      ) : null}

      <div className={`grid grid-cols-1 gap-4 ${compact ? 'lg:grid-cols-2' : 'md:grid-cols-2'}`}>
        <MetaCard
          title={t('common.warnings')}
          items={warnings}
          icon={<AlertTriangle className="h-4 w-4" />}
          className="border-orange-200 bg-orange-50 text-orange-900"
        />
        <MetaCard
          title={t('common.assumptions')}
          items={assumptions}
          icon={<Target className="h-4 w-4" />}
          className="border-blue-200 bg-blue-50 text-blue-900"
        />
        <MetaCard
          title={t('common.notes')}
          items={calculationNotes}
          icon={<FileText className="h-4 w-4" />}
          className="border-emerald-200 bg-emerald-50 text-emerald-900"
        />
        <MetaCard
          title={t('common.data_quality')}
          items={dataQualityFlags}
          icon={<ShieldAlert className="h-4 w-4" />}
          className="border-amber-200 bg-amber-50 text-amber-900"
        />
      </div>

      {!warnings.length && !assumptions.length && !calculationNotes.length && !dataQualityFlags.length && dataFreshness ? (
        <div className="rounded-xl border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 font-medium">
            <DatabaseZap className="h-4 w-4" />
            {t('comparison.live_calculation')}
          </span>
        </div>
      ) : null}
    </div>
  );
};
