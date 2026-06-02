'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReferenceMetaItem } from '@/shared/lib/data-reference';

interface ReferenceChartFrameProps {
  metaItems: ReferenceMetaItem[];
  sourceLabel: string;
  actions?: React.ReactNode;
  notice?: string;
  noticeTone?: 'default' | 'warning';
  fallbackNotice?: string;
  fallbackTone?: 'good' | 'warning';
  children: React.ReactNode;
}

export function ReferenceChartFrame({
  metaItems,
  sourceLabel,
  actions,
  notice,
  noticeTone = 'default',
  fallbackNotice,
  fallbackTone = 'good',
  children,
}: ReferenceChartFrameProps) {
  const primaryMeta = metaItems.slice(0, 4);

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="space-y-4 border-y border-border py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>{sourceLabel}</span>
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
              {primaryMeta.map((item) => (
                <div key={item.label} className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-medium text-foreground">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        {fallbackNotice ? (
          <div
            className={cn(
              'flex items-start gap-2 border-l-2 pl-3 text-sm leading-6',
              fallbackTone === 'warning'
                ? 'border-warning text-foreground'
                : 'border-success text-foreground',
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
            'border-l-2 pl-3 text-sm leading-6',
            noticeTone === 'warning'
              ? 'border-warning text-foreground'
              : 'border-border text-muted-foreground',
          )}
        >
          {notice}
        </div>
      ) : null}

      <div className="border-t border-border pt-4">
        {children}
      </div>
    </div>
  );
}
