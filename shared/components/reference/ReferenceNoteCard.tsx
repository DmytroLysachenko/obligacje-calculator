'use client';

import React from 'react';
import { cn } from '@/lib/utils';

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
      className={cn(
        'space-y-3 rounded-lg border p-4 shadow-sm',
        tone === 'warning'
          ? 'border-warning/30 bg-warning/5'
          : 'border-border bg-card',
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="ui-card-title">{title}</p>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </section>
  );
}
