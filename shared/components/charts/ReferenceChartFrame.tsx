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
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
            <div className="min-w-0">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {metaItems.map((item) => (
                  <div key={item.label} className="min-w-0 rounded-xl bg-white/75 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">
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
              'mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm leading-6',
              fallbackTone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900',
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
            'rounded-2xl border px-4 py-3.5 text-sm leading-7',
            noticeTone === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-white text-slate-600',
          )}
        >
          {notice}
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-slate-200 bg-white/92 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.3)] md:p-5">
        {children}
      </div>
    </div>
  );
}
