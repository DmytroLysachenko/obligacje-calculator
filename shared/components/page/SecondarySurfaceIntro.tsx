'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SecondarySurfaceIntroAction {
  href: string;
  label: string;
  variant?: 'default' | 'outline';
}

interface SecondarySurfaceIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: SecondarySurfaceIntroAction[];
  tone?: 'neutral' | 'amber';
}

export function SecondarySurfaceIntro({
  eyebrow,
  title,
  description,
  actions = [],
  tone = 'neutral',
}: SecondarySurfaceIntroProps) {
  return (
    <section
      className={cn(
        'space-y-4 rounded-[1.9rem] border px-6 py-6 md:px-8 md:py-8',
        tone === 'amber'
          ? 'border-amber-200 bg-amber-50/55'
          : 'border-slate-200 bg-white',
      )}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
        {eyebrow}
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="max-w-4xl text-sm leading-8 text-slate-600">
          {description}
        </p>
      </div>
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-3 border-t border-dashed border-slate-200 pt-4">
          {actions.map((action) => (
            <Button
              key={`${action.href}-${action.label}`}
              asChild
              variant={action.variant ?? 'default'}
              className={cn(
                'rounded-2xl',
                action.variant === 'outline'
                  ? 'border-slate-200 bg-white'
                  : undefined,
              )}
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
