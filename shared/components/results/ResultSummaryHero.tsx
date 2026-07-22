'use client';

import React from 'react';

import { ResultAction, ResultActionGrid } from './ResultActionGrid';

interface ResultSummaryHeroProps {
  eyebrow: string;
  value: string;
  description: string;
  narrative?: string;
  deltaText?: string;
  actions?: ResultAction[];
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
    <section className="overflow-hidden border-y border-border bg-background">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-4xl space-y-4 p-5 md:p-6">
          <div className="surface-chip">{eyebrow}</div>

          <div className="space-y-2">
            <h2 className="financial-number ui-primary-metric min-w-0 break-words">{value}</h2>
            <p className="ui-body max-w-4xl text-muted-foreground">{description}</p>
          </div>
        </div>

        {actions.length > 0 ? (
          <ResultActionGrid actions={actions} />
        ) : aside ? (
          <div className="border-t border-border bg-muted/20 p-5 lg:w-[280px] lg:shrink-0 lg:border-l lg:border-t-0">
            {aside}
          </div>
        ) : null}
      </div>

      {narrative || deltaText ? (
        <div className="w-full space-y-3 border-t border-border bg-background px-5 py-4 md:px-6">
          {narrative ? <p className="ui-body">{narrative}</p> : null}
          {deltaText ? <p className="ui-meta">{deltaText}</p> : null}
        </div>
      ) : null}
    </section>
  );
});
