'use client';

import React from 'react';

interface CalculatorSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function CalculatorSection({
  title,
  description,
  children,
}: CalculatorSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h3 className="ui-section-title">
          {title}
        </h3>
        {description ? (
          <p className="ui-body max-w-3xl">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
