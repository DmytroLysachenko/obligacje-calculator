'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReadyStepItem {
  id: string;
  title: string;
  description: string;
}

interface ScenarioReadyPanelProps {
  badge: string;
  title: string;
  description: string;
  steps: ReadyStepItem[];
  ctaLabel?: string;
  onClick?: () => void;
  footerText?: string;
}

function ReadyStepCard({
  title,
  description,
}: Pick<ReadyStepItem, 'title' | 'description'>) {
  return (
    <div className="space-y-2 rounded-md border border-border bg-card px-4 py-4">
      <p className="ui-card-title">
        {title}
      </p>
      <p className="ui-body text-muted-foreground">{description}</p>
    </div>
  );
}

export function ScenarioReadyPanel({
  badge,
  title,
  description,
  steps,
  ctaLabel,
  onClick,
  footerText,
}: ScenarioReadyPanelProps) {
  return (
    <section className="space-y-6 rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="space-y-3">
        <div className="surface-chip">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          {badge}
        </div>
        <h3 className="ui-section-title">
          {title}
        </h3>
        <p className="ui-body max-w-3xl text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <ReadyStepCard
            key={step.id}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>

      {ctaLabel && onClick ? (
        <div className="max-w-xs border-t border-border pt-4">
          <Button
            onClick={onClick}
            className="w-full focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
          >
            {ctaLabel}
          </Button>
        </div>
      ) : null}

      {footerText ? (
        <p className="rounded-md border border-border bg-muted/25 px-4 py-3 text-sm leading-6 text-muted-foreground">
          {footerText}
        </p>
      ) : null}
    </section>
  );
}
