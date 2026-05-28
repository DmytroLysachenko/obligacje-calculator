'use client';

import React from 'react';

interface RateContextNoteProps {
  title?: string;
  badges?: string[];
  narrative: string;
  className?: string;
}

export function RateContextNote({
  title,
  badges,
  narrative,
  className,
}: RateContextNoteProps) {
  return (
    <div className={className ?? 'space-y-2 border-t border-dashed border-slate-200 pt-3'}>
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          {title}
        </p>
      ) : null}
      {badges && badges.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-sm leading-6 text-slate-600">{narrative}</p>
    </div>
  );
}
