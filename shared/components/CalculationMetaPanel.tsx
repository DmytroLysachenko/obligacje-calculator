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
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  className: string;
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-widest">
          {title}
        </p>
      </div>
      <ul className="space-y-2 text-sm leading-6">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-xl bg-white/70 px-3 py-2">
            {item}
          </li>
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
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : 'border-amber-200 bg-amber-50 text-amber-950';

  return (
    <div className="space-y-4">
      {dataFreshness ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${freshnessTone}`}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  dataFreshness.status === 'fresh'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
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
        className={`grid grid-cols-1 gap-4 ${
          compact ? 'xl:grid-cols-2' : 'md:grid-cols-2'
        }`}
      >
        <MetaSection
          title={t('common.warnings')}
          items={warnings}
          icon={<AlertTriangle className="h-4 w-4" />}
          className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-orange-950"
        />
        <MetaSection
          title={t('common.assumptions')}
          items={assumptions}
          icon={<Target className="h-4 w-4" />}
          className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-blue-950"
        />
        <MetaSection
          title={t('common.notes')}
          items={calculationNotes}
          icon={<FileText className="h-4 w-4" />}
          className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950"
        />
        <MetaSection
          title={t('common.data_quality')}
          items={dataQualityFlags}
          icon={<ShieldAlert className="h-4 w-4" />}
          className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <DatabaseZap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-slate-950">
            {t('common.calculation_audit')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{t('comparison.live_calculation')}</span>
          <span>
            {t('common.engine_version')}: <span className="font-semibold text-slate-950">{calculationVersion}</span>
          </span>
        </div>
      </div>
    </div>
  );
};




