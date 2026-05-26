'use client';

import React from 'react';

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold tracking-[0.08em] text-slate-700">
        {title}
      </h3>
      <p className="text-[15px] leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
