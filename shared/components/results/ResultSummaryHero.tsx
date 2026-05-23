'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HeroAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline';
  disabled?: boolean;
}

interface ResultSummaryHeroProps {
  eyebrow: string;
  value: string;
  description: string;
  narrative?: string;
  deltaText?: string;
  actions?: HeroAction[];
  aside?: React.ReactNode;
}

export function ResultSummaryHero({
  eyebrow,
  value,
  description,
  narrative,
  deltaText,
  actions = [],
  aside,
}: ResultSummaryHeroProps) {
  return (
    <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {eyebrow}
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-slate-950">
                {value}
              </h2>
              <p className="max-w-4xl text-sm leading-8 text-slate-600 md:text-[15px]">
                {description}
              </p>
            </div>
          </div>

          {actions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[440px] lg:shrink-0">
              {actions.map((action) => (
                <Button
                  type="button"
                  key={action.label}
                  variant={action.variant ?? 'outline'}
                  className={cn(
                    'gap-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
                    (action.variant ?? 'outline') === 'outline'
                      ? 'border-slate-200 bg-white text-slate-700'
                      : '',
                  )}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          ) : aside ? (
            <div className="lg:w-[260px] lg:shrink-0">{aside}</div>
          ) : null}
        </div>

        {narrative || deltaText ? (
          <div className="space-y-3">
            {narrative ? (
              <p className="text-sm leading-7 text-slate-700 md:text-[15px]">{narrative}</p>
            ) : null}
            {deltaText ? <p className="text-sm text-slate-600 md:text-[15px]">{deltaText}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
