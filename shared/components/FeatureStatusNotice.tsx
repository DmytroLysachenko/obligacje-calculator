'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, FlaskConical, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeatureStatus = 'trusted' | 'conditional' | 'experimental' | 'limited' | 'reference';

const statusConfig: Record<
  FeatureStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
    pillClassName: string;
  }
> = {
  trusted: {
    label: 'Trusted core',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    pillClassName: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  },
  conditional: {
    label: 'Conditional',
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-950',
    pillClassName: 'border-blue-200 bg-blue-100 text-blue-800',
  },
  experimental: {
    label: 'Experimental',
    icon: FlaskConical,
    className: 'border-amber-200 bg-amber-50 text-amber-950',
    pillClassName: 'border-amber-200 bg-amber-100 text-amber-800',
  },
  limited: {
    label: 'Limited support',
    icon: AlertTriangle,
    className: 'border-orange-200 bg-orange-50 text-orange-950',
    pillClassName: 'border-orange-200 bg-orange-100 text-orange-800',
  },
  reference: {
    label: 'Reference',
    icon: Info,
    className: 'border-slate-200 bg-slate-50 text-slate-950',
    pillClassName: 'border-slate-200 bg-slate-100 text-slate-700',
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
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
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
    <div className={cn('rounded-2xl border p-5 shadow-none', config.className, className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow ? (
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-current/70">
                {eyebrow}
              </span>
            ) : null}
            <p className="font-semibold">{title}</p>
            <FeatureStatusPill status={status} />
          </div>
          <div className="text-sm leading-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
