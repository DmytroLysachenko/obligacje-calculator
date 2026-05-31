'use client';

import React from 'react';
interface ReferenceNoteCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: 'default' | 'warning';
}

export function ReferenceNoteCard({
  icon,
  title,
  description,
  tone = 'default',
}: ReferenceNoteCardProps) {
  return (
    <section
      className={
        tone === 'warning'
          ? 'space-y-3 rounded-lg border border-[var(--finance-warning)]/40 bg-card px-4 py-4 shadow-none'
          : 'space-y-3 rounded-lg border border-border bg-card px-4 py-4 shadow-none'
      }
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="ui-card-title">{title}</p>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </section>
  );
}
