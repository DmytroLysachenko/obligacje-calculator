'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card
      className={cn(
        'rounded-[2rem] border shadow-[0_20px_52px_-46px_rgba(15,23,42,0.42)] backdrop-blur',
        tone === 'amber'
          ? 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.88),rgba(255,255,255,0.94))]'
          : 'border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.92))]',
      )}
    >
      <CardContent className="space-y-4 p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
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
          <div className="flex flex-wrap gap-3 pt-1">
            {actions.map((action) => (
              <Button
                key={`${action.href}-${action.label}`}
                asChild
                variant={action.variant ?? 'default'}
                className={cn(
                  'rounded-2xl',
                  action.variant === 'outline'
                    ? 'border-slate-200 bg-white/80'
                    : undefined,
                )}
              >
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
