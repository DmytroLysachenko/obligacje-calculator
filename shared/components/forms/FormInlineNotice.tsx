'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface FormInlineNoticeProps {
  title?: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning';
  className?: string;
}

const toneClass = {
  neutral: 'border-border bg-muted/20 text-muted-foreground',
  success: 'border-success/30 bg-success/5 text-[var(--finance-success)]',
  warning: 'border-warning/30 bg-warning/5 text-warning',
} as const;

export function FormInlineNotice({
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: FormInlineNoticeProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-l-2 px-4 py-3 text-sm leading-6',
        toneClass[tone],
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
        <p className="ui-safe-text text-xs leading-5">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
