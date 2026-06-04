import React from 'react';
import { cn } from '@/lib/utils';

interface ScenarioSetupCardProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  tone?: 'neutral' | 'scenario-a' | 'scenario-b';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const toneClass = {
  neutral: 'border-border',
  'scenario-a': 'border-border data-[tone=scenario-a]:border-l-primary/60',
  'scenario-b': 'border-border data-[tone=scenario-b]:border-l-success/60',
} as const;

export function ScenarioSetupCard({
  title,
  eyebrow,
  description,
  meta,
  tone = 'neutral',
  children,
  footer,
  className,
}: ScenarioSetupCardProps) {
  return (
    <section
      data-tone={tone}
      className={cn(
        'rounded-lg border border-l-2 bg-card px-4 py-4 shadow-sm sm:px-5',
        toneClass[tone],
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className="ui-metadata text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="ui-card-title">
            {title}
          </h3>
          {description ? (
            <p className="max-w-prose text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? (
          <div className="shrink-0 text-left sm:text-right">
            {meta}
          </div>
        ) : null}
      </div>

      <div className="space-y-5 py-5">
        {children}
      </div>

      {footer ? (
        <div className="border-t border-border pt-4">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
