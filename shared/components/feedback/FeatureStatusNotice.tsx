'use client';
import React from 'react';
import { AlertTriangle, CheckCircle2, FlaskConical, Info } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

export type FeatureStatus = 'trusted' | 'conditional' | 'experimental' | 'limited' | 'reference';
const statusConfig: Record<FeatureStatus, {
    icon: React.ComponentType<{
        className?: string;
    }>;
    noticeClassName: string;
    pillClassName: string;
}> = {
    trusted: {
        icon: CheckCircle2,
        noticeClassName: 'border-emerald-200 bg-emerald-50/55 text-emerald-950',
        pillClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    conditional: {
        icon: Info,
        noticeClassName: 'border-blue-200 bg-blue-50/55 text-blue-950',
        pillClassName: 'border-blue-200 bg-blue-50 text-blue-800',
    },
    experimental: {
        icon: FlaskConical,
        noticeClassName: 'border-amber-200 bg-amber-50/55 text-amber-950',
        pillClassName: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    limited: {
        icon: AlertTriangle,
        noticeClassName: 'border-orange-200 bg-orange-50/55 text-orange-950',
        pillClassName: 'border-orange-200 bg-orange-50 text-orange-800',
    },
    reference: {
        icon: Info,
        noticeClassName: 'border-slate-200 bg-slate-50/80 text-slate-900',
        pillClassName: 'border-slate-200 bg-slate-50 text-slate-700',
    },
};
export function FeatureStatusPill({ status, className, }: {
    status: FeatureStatus;
    className?: string;
}) {
    const { t } = useAppI18n();
    const config = statusConfig[status];
    return (<span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.08em]', config.pillClassName, className)}>
      {t(`shared.feature_status.labels.${status}`)}
    </span>);
}
export function FeatureStatusNotice({ status, title, children, className, eyebrow, }: {
    status: FeatureStatus;
    title: string;
    children: React.ReactNode;
    className?: string;
    eyebrow?: string;
}) {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (<section className={cn('rounded-[1.7rem] border px-5 py-4 md:px-6 md:py-5', config.noticeClassName, className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80"/>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow ? (<span className="text-xs font-semibold text-current/65">
                {eyebrow}
              </span>) : null}
            <p className="text-[15px] font-semibold tracking-tight md:text-base">{title}</p>
            <FeatureStatusPill status={status}/>
          </div>
          <div className="text-[15px] leading-7 text-current/90">{children}</div>
        </div>
      </div>
    </section>);
}




