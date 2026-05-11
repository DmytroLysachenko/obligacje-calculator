'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="surface-soft rounded-[1.75rem]">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>
        <p className="text-[15px] leading-7 text-slate-600">{description}</p>
      </CardContent>
    </Card>
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
    <Card className="surface-panel rounded-[2rem]">
      <CardContent className="space-y-5 p-5 md:p-8">
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
          <div className="max-w-xs">
            <Button
              onClick={onClick}
              className="w-full focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
            >
              {ctaLabel}
            </Button>
          </div>
        ) : null}

        {footerText ? (
          <p className="text-[15px] leading-7 text-slate-600">{footerText}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
