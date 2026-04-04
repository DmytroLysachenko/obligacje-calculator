'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, DatabaseZap, FileText, ShieldAlert, Target, Clock, Cpu } from 'lucide-react';
import { useLanguage } from '@/i18n';
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
    <div className={`rounded-2xl border-2 p-4 shadow-sm transition-all hover:shadow-md ${className}`}>
      <h4 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        {icon}
        {title}
      </h4>
      <ul className="list-inside list-disc space-y-1.5 text-xs font-medium">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="leading-relaxed">{item}</li>
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
  calculationVersion = "v1.2.0",
  compact = false,
}) => {
  const { t } = useLanguage();
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    // Only set on mount to avoid cascading renders and hydration mismatch
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimestamp(now.toLocaleString());
  }, []);

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
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      {dataFreshness ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${dataFreshness.status === 'fresh' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
            <span>{t('comparison.freshness_status')}:</span>
            <span className="text-foreground">{t(`comparison.status_${dataFreshness.status}`)}</span>
          </div>
          {dataFreshness.asOf && (
            <>
              <div className="h-3 w-px bg-muted-foreground/20" />
              <span>{t('economic.as_of')}: <span className="text-foreground">{dataFreshness.asOf}</span></span>
            </>
          )}
          {dataFreshness.usedFallback && (
            <>
              <div className="h-3 w-px bg-muted-foreground/20" />
              <span className="text-amber-600">{t('comparison.fallback_used')}</span>
            </>
          )}
        </div>
      ) : null}

      <div className={`grid grid-cols-1 gap-4 ${compact ? 'lg:grid-cols-2' : 'md:grid-cols-2'}`}>
        <MetaCard
          title={t('common.warnings')}
          items={warnings}
          icon={<AlertTriangle className="h-4 w-4" />}
          className="border-orange-200 bg-orange-50/50 text-orange-900"
        />
        <MetaCard
          title={t('common.assumptions')}
          items={assumptions}
          icon={<Target className="h-4 w-4" />}
          className="border-blue-200 bg-blue-50/50 text-blue-900"
        />
        <MetaCard
          title={t('common.notes')}
          items={calculationNotes}
          icon={<FileText className="h-4 w-4" />}
          className="border-emerald-200 bg-emerald-50/50 text-emerald-900"
        />
        <MetaCard
          title={t('common.data_quality')}
          items={dataQualityFlags}
          icon={<ShieldAlert className="h-4 w-4" />}
          className="border-amber-200 bg-amber-50/50 text-amber-900"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border-2 border-dashed bg-muted/10 p-4">
        <div className="flex items-center gap-4">
          <div className="bg-background p-2 rounded-lg border shadow-sm">
            <Cpu className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('common.calculation_audit')}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {timestamp || '---'}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <div className="h-1 w-1 rounded-full bg-primary" />
                {t('common.engine_version')}: {calculationVersion}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border shadow-sm">
          <DatabaseZap className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-tighter text-primary">
            {t('comparison.live_calculation')}
          </span>
        </div>
      </div>
    </div>
  );
};
