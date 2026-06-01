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
          ? 'space-y-3 border-t border-[var(--finance-warning)]/40 py-4'
          : 'space-y-3 border-t border-border py-4'
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
