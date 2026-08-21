'use client';

import React from 'react';

import { InfoTooltip } from '@/shared/components/feedback/InfoTooltip';

export function ChartSupportNote({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-l-2 border-border px-3 py-1">
      <div className="flex items-center gap-1">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <InfoTooltip content={description} />
      </div>
    </div>
  );
}
