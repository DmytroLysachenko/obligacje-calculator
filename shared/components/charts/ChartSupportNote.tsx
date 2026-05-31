'use client';

import React from 'react';

export function ChartSupportNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-t border-border px-1 pt-3">
      <p className="text-xs font-semibold text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
