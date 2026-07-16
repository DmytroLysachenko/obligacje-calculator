'use client';

import { Check, Loader2 } from 'lucide-react';
import React from 'react';

import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

type PageHeaderStatusTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface PageHeaderStatus {
  label: string;
  state?: 'idle' | 'loading' | 'complete';
  tone?: PageHeaderStatusTone;
}

interface PageHeaderProps {
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  status?: PageHeaderStatus | null;
  action?: React.ReactNode;
  className?: string;
}

const statusToneClass: Record<PageHeaderStatusTone, string> = {
  neutral: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

function StatusLine({ status }: { status?: PageHeaderStatus | null }) {
  const { t } = useAppI18n();

  if (!status) {
    return null;
  }

  const Icon = status.state === 'loading' ? Loader2 : status.state === 'complete' ? Check : null;

  return (
    <div className="ui-status-note" role="status" aria-live="polite">
      <span
        className={cn('inline-flex items-center gap-2', statusToneClass[status.tone ?? 'neutral'])}
      >
        {Icon ? (
          <Icon
            className={cn('h-4 w-4', status.state === 'loading' && 'animate-spin')}
            aria-hidden="true"
          />
        ) : null}
        <span className="sr-only">{t(`common.status_${status.state ?? 'idle'}`)}: </span>
        <span>{status.label}</span>
      </span>
    </div>
  );
}

export function PageHeader({
  icon,
  eyebrow,
  title,
  description,
  status,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('ui-page-header space-y-4', className)}>
      <div className="ui-page-header-content">
        <div className="ui-section-intro">
          <div className="flex items-start gap-3 md:items-center">
            <div className="ui-icon-tile" aria-hidden="true">
              {icon}
            </div>
            <div className="min-w-0 space-y-1">
              {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
              <h1 className="ui-page-title">{title}</h1>
              {description ? (
                <p className="ui-body ui-pretty text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          <StatusLine status={status} />
        </div>

        {action ? <div className="ui-action-row-end">{action}</div> : null}
      </div>
    </header>
  );
}
