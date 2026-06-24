import React from 'react';

import { RetirementMetricTone } from '../types/retirement';

export function RetirementSummaryMetric({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: RetirementMetricTone;
}) {
  const toneClass =
    tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-foreground';

  return (
    <div className="space-y-2 border-b border-dashed border-border px-4 py-4 last:border-b-0 md:border-b-0 md:border-r last:md:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className={`text-xl font-semibold ${toneClass}`}>{value}</p>
      <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export function RetirementSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 bg-transparent">
      <div className="space-y-2">
        <h3 className="ui-section-title">{title}</h3>
        {description ? (
          <p className="ui-body max-w-3xl text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
