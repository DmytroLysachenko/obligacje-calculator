'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceChartFrameProps {
  meta: string;
  actions?: React.ReactNode;
  notice?: string;
  noticeTone?: 'default' | 'warning';
  children: React.ReactNode;
}

export function ReferenceChartFrame({
  meta,
  actions,
  notice,
  noticeTone = 'default',
  children,
}: ReferenceChartFrameProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-600">
        <div className="flex min-w-0 items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <p className="min-w-0 leading-7">{meta}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
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
