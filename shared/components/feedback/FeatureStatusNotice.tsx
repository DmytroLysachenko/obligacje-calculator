'use client';
import { AlertTriangle, CheckCircle2, FlaskConical, Info } from 'lucide-react';
import React from 'react';

import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

export type FeatureStatus = 'trusted' | 'conditional' | 'experimental' | 'limited' | 'reference';
const statusConfig: Record<
  FeatureStatus,
  {
    icon: React.ComponentType<{
      className?: string;
    }>;
    noticeClassName: string;
    pillClassName: string;
  }
> = {
  trusted: {
    icon: CheckCircle2,
    noticeClassName: 'border-success bg-success/5 text-foreground',
    pillClassName: 'text-success',
  },
  conditional: {
    icon: Info,
    noticeClassName: 'border-border bg-muted/20 text-foreground',
    pillClassName: 'text-muted-foreground',
  },
  experimental: {
    icon: FlaskConical,
    noticeClassName: 'border-warning bg-warning/5 text-foreground',
    pillClassName: 'text-warning',
  },
  limited: {
    icon: AlertTriangle,
    noticeClassName: 'border-warning bg-warning/5 text-foreground',
    pillClassName: 'text-warning',
  },
  reference: {
    icon: Info,
    noticeClassName: 'border-border bg-muted/20 text-foreground',
    pillClassName: 'text-muted-foreground',
  },
};
export function FeatureStatusPill({
  status,
  className,
}: {
  status: FeatureStatus;
  className?: string;
}) {
  const { t } = useAppI18n();
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.08em]',
        config.pillClassName,
        className,
      )}
    >
      {t(`shared.feature_status.labels.${status}`)}
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
    <section className={cn('border-l-2 px-4 py-4', config.noticeClassName, className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow ? (
              <span className="text-xs font-semibold text-current/65">{eyebrow}</span>
            ) : null}
            <p className="ui-card-title">{title}</p>
            <FeatureStatusPill status={status} />
          </div>
          <div className="text-sm leading-6 text-current/80">{children}</div>
        </div>
      </div>
    </section>
  );
}
