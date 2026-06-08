'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReferenceMetaItem } from '@/shared/lib/data-reference';
import { Notice } from '@/shared/components/feedback/Notice';

interface ReferenceChartFrameProps {
  metaItems: ReferenceMetaItem[];
  sourceLabel: string;
  actions?: React.ReactNode;
  notice?: string;
  noticeTone?: 'default' | 'warning';
  fallbackNotice?: string;
  fallbackTone?: 'good' | 'warning';
  fallbackStatusLabel?: string;
  syncedStatusLabel?: string;
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
  fallbackStatusLabel = 'Fallback',
  syncedStatusLabel = 'Synced',
  children,
}: ReferenceChartFrameProps) {
  const primaryMeta = metaItems.slice(0, 4);
  const healthToneClass = fallbackTone === 'warning'
    ? 'border-warning text-warning'
    : 'border-success text-success';

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
          <Notice tone={fallbackTone === 'warning' ? 'warning' : 'success'} compact className="border-0 bg-transparent px-0">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <div className={cn('inline-flex items-center gap-2 border-l-2 pl-3 text-xs font-semibold', healthToneClass)}>
                {fallbackTone === 'warning' ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                {fallbackTone === 'warning' ? fallbackStatusLabel : syncedStatusLabel}
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{fallbackNotice}</p>
            </div>
          </Notice>
        ) : null}
      </div>

      {notice ? (
        <Notice tone={noticeTone === 'warning' ? 'warning' : 'info'} compact>
          {notice}
        </Notice>
      ) : null}

      <div className="border-t border-border pt-4">
        {children}
      </div>
    </div>
  );
}
