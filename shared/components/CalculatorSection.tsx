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
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
