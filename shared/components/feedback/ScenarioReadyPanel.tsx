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
    <div className="space-y-2 rounded-[1.35rem] border border-slate-200 px-4 py-4">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>
      <p className="text-[15px] leading-7 text-slate-600">{description}</p>
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
    <section className="space-y-5 rounded-[1.9rem] border border-slate-200 bg-white px-5 py-5 md:px-8 md:py-8">
      <div className="space-y-3">
        <div className="surface-chip">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          {badge}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="max-w-3xl text-[15px] leading-8 text-slate-600 md:text-base">
          {description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <ReadyStepCard
            key={step.id}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>

      {ctaLabel && onClick ? (
        <div className="max-w-xs border-t border-dashed border-slate-200 pt-4">
          <Button
            onClick={onClick}
            className="w-full focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
          >
            {ctaLabel}
          </Button>
        </div>
      ) : null}

      {footerText ? (
        <p className="border-t border-dashed border-slate-200 pt-4 text-[15px] leading-7 text-slate-600">
          {footerText}
        </p>
      ) : null}
    </section>
  );
}
