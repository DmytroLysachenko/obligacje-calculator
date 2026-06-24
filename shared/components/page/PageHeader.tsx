'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PageHeaderStatusTone = 'neutral' | 'success' | 'warning' | 'danger';

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

export function StatusLine({ status }: { status?: PageHeaderStatus | null }) {
  if (!status) {
    return null;
  }

  const Icon = status.state === 'loading' ? Loader2 : status.state === 'complete' ? Check : null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-muted-foreground">
      <span
        className={cn('inline-flex items-center gap-2', statusToneClass[status.tone ?? 'neutral'])}
      >
        {Icon ? (
          <Icon className={cn('h-4 w-4', status.state === 'loading' && 'animate-spin')} />
        ) : null}
        {status.label}
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
    <header className={cn('space-y-4 border-b border-border pb-8 md:pb-10', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[var(--layout-reading-max)] space-y-2">
          <div className="flex items-start gap-3 md:items-center">
            <div className="rounded-md bg-muted p-2 text-foreground">{icon}</div>
            <div className="space-y-1">
              {eyebrow ? <p className="ui-metadata text-muted-foreground">{eyebrow}</p> : null}
              <h2 className="ui-page-title">{title}</h2>
              {description ? <p className="ui-body text-muted-foreground">{description}</p> : null}
            </div>
          </div>
          <StatusLine status={status} />
        </div>

        {action ? (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">{action}</div>
        ) : null}
      </div>
    </header>
  );
}
