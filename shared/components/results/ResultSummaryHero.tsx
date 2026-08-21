'use client';

import React from 'react';

import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';

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
  const headingId = React.useId();

  return (
    <section
      className="overflow-hidden border-y border-border bg-background"
      aria-labelledby={headingId}
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-4xl space-y-4 p-5 md:p-6">
          <p className="ui-eyebrow">{eyebrow}</p>

          <div className="space-y-2">
            <h2
              id={headingId}
              className="financial-number ui-primary-metric min-w-0 whitespace-nowrap"
            >
              {value}
            </h2>
            <div className="flex items-start gap-1">
              <p className="ui-body max-w-4xl text-muted-foreground">{description}</p>
              {narrative || deltaText ? (
                <InfoTooltip
                  content={
                    <>
                      {narrative ? <p>{narrative}</p> : null}
                      {deltaText ? (
                        <p className={narrative ? 'mt-2' : undefined}>{deltaText}</p>
                      ) : null}
                    </>
                  }
                />
              ) : null}
            </div>
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
    </section>
  );
});
