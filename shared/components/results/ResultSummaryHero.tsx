'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
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

export const ResultSummaryHero = React.memo(function ResultSummaryHero({
  eyebrow,
  value,
  description,
  narrative,
  deltaText,
  actions = [],
  aside,
}: ResultSummaryHeroProps) {
  return (
    <section className="space-y-6 border-y border-border py-6 md:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl space-y-3">
          <div className="surface-chip">
            {eyebrow}
          </div>

          <div className="space-y-2">
            <h2 className="ui-primary-metric">
              {value}
            </h2>
            <p className="ui-body max-w-4xl text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {actions.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4 lg:w-[440px] lg:shrink-0 lg:border-t-0 lg:pt-0">
            {actions.map((action) => (
              <Button
                type="button"
                key={action.label}
                variant={action.variant ?? 'outline'}
                className={cn(
                  'gap-2 text-xs font-medium',
                  (action.variant ?? 'outline') === 'outline'
                    ? 'border-border bg-card text-foreground'
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
        <div className="max-w-4xl space-y-3">
          {narrative ? (
            <p className="ui-body">{narrative}</p>
          ) : null}
          {deltaText ? <p className="ui-meta">{deltaText}</p> : null}
        </div>
      ) : null}
    </section>
  );
});
