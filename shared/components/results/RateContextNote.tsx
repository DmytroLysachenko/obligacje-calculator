'use client';

import React from 'react';

interface RateContextNoteProps {
  title?: string;
  badges?: string[];
  narrative: string;
  className?: string;
}

export function RateContextNote({ title, badges, narrative, className }: RateContextNoteProps) {
  return (
    <div className={className ?? 'space-y-2 border-t border-dashed border-border pt-3'}>
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
      ) : null}
      {badges && badges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-sm leading-6 text-muted-foreground">{narrative}</p>
    </div>
  );
}
