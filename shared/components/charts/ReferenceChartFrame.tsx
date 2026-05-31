'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReferenceMetaItem } from '@/shared/lib/data-reference';

interface ReferenceChartFrameProps {
  metaItems: ReferenceMetaItem[];
  actions?: React.ReactNode;
  notice?: string;
  noticeTone?: 'default' | 'warning';
  fallbackNotice?: string;
  fallbackTone?: 'good' | 'warning';
  children: React.ReactNode;
}

export function ReferenceChartFrame({
  metaItems,
  actions,
  notice,
  noticeTone = 'default',
  fallbackNotice,
  fallbackTone = 'good',
  children,
}: ReferenceChartFrameProps) {
  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="rounded-lg border border-border bg-card px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="grid w-full gap-0 overflow-hidden rounded-md border border-border sm:grid-cols-2 xl:grid-cols-4">
                {metaItems.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-0 border-border px-3 py-2.5 sm:border-r xl:last:border-r-0 [&:nth-child(2n)]:sm:border-r-0 [&:nth-child(n+3)]:xl:border-t-0 [&:nth-child(n+3)]:sm:border-t"
                  >
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        {fallbackNotice ? (
          <div
            className={cn(
              'mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-sm leading-6',
              fallbackTone === 'warning'
                ? 'border-[var(--finance-warning)]/40 bg-transparent text-foreground'
                : 'border-[var(--finance-success)]/35 bg-transparent text-foreground',
            )}
          >
            {fallbackTone === 'warning' ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{fallbackNotice}</p>
          </div>
        ) : null}
      </div>

      {notice ? (
        <div
          className={cn(
            'rounded-md border px-4 py-3.5 text-sm leading-6',
            noticeTone === 'warning'
              ? 'border-[var(--finance-warning)]/40 bg-transparent text-foreground'
              : 'border-border bg-card text-muted-foreground',
          )}
        >
          {notice}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-4 shadow-none md:p-5">
        {children}
      </div>
    </div>
  );
}
