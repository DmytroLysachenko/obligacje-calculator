'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BondInfoPanelBadge {
  label: React.ReactNode;
  tone?: 'neutral' | 'warning' | 'success';
}

interface BondInfoPanelProps {
  title: React.ReactNode;
  description: React.ReactNode;
  supportDescription?: React.ReactNode;
  narrative?: React.ReactNode;
  badges?: BondInfoPanelBadge[];
  notice?: React.ReactNode;
  className?: string;
}

const badgeToneClass = {
  neutral: 'bg-background text-muted-foreground',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
} as const;

export function BondInfoPanel({
  title,
  description,
  supportDescription,
  narrative,
  badges = [],
  notice,
  className,
}: BondInfoPanelProps) {
  return (
    <div
      className={cn(
        'space-y-3 border-l-2 border-border bg-muted/20 px-4 py-3 text-sm',
        className,
      )}
    >
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>{title}</span>
      </div>
      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <span
              key={index}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold',
                badgeToneClass[badge.tone ?? 'neutral'],
              )}
            >
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="space-y-2 leading-relaxed text-muted-foreground">
        <p>{description}</p>
        {narrative ? <p>{narrative}</p> : null}
        {supportDescription ? <p>{supportDescription}</p> : null}
      </div>
      {notice ? (
        <p className="font-semibold text-warning">{notice}</p>
      ) : null}
    </div>
  );
}
