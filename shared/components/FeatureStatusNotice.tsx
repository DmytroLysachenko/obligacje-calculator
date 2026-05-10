'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, FlaskConical, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeatureStatus =
  | 'trusted'
  | 'conditional'
  | 'experimental'
  | 'limited'
  | 'reference';

const statusConfig: Record<
  FeatureStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    noticeClassName: string;
    pillClassName: string;
  }
> = {
  trusted: {
    label: 'Main tool',
    icon: CheckCircle2,
    noticeClassName: 'border-emerald-200 bg-emerald-50/55 text-emerald-950',
    pillClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  conditional: {
    label: 'Next step',
    icon: Info,
    noticeClassName: 'border-blue-200 bg-blue-50/55 text-blue-950',
    pillClassName: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  experimental: {
    label: 'Experimental lab',
    icon: FlaskConical,
    noticeClassName: 'border-amber-200 bg-amber-50/55 text-amber-950',
    pillClassName: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  limited: {
    label: 'Limited scope',
    icon: AlertTriangle,
    noticeClassName: 'border-orange-200 bg-orange-50/55 text-orange-950',
    pillClassName: 'border-orange-200 bg-orange-50 text-orange-800',
  },
  reference: {
    label: 'Reference',
    icon: Info,
    noticeClassName: 'border-slate-200 bg-slate-50/80 text-slate-900',
    pillClassName: 'border-slate-200 bg-slate-50 text-slate-700',
  },
};

export function FeatureStatusPill({
  status,
  className,
}: {
  status: FeatureStatus;
  className?: string;
}) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]',
        config.pillClassName,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

export function FeatureStatusNotice({
  status,
  title,
  children,
  className,
  eyebrow,
}: {
  status: FeatureStatus;
  title: string;
  children: React.ReactNode;
  className?: string;
  eyebrow?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-[1.8rem] border px-5 py-4 shadow-none',
        config.noticeClassName,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow ? (
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-current/70">
                {eyebrow}
              </span>
            ) : null}
            <p className="font-semibold tracking-tight">{title}</p>
            <FeatureStatusPill status={status} />
          </div>
          <div className="text-sm leading-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
