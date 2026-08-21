'use client';

import React from 'react';

import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';
interface ScenarioFactsItem {
  label: string;
  value: string;
}

interface ScenarioFactsBlockProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  items: ScenarioFactsItem[];
}

export function ScenarioFactsBlock({
  title,
  description,
  actions,
  items,
}: ScenarioFactsBlockProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1">
            <h3 className="ui-section-title">{title}</h3>
            <InfoTooltip content={description} />
          </div>
        </div>
        {actions}
      </div>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {items.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="ui-meta font-semibold">{fact.label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
