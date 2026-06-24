'use client';

import { CheckCircle2 } from 'lucide-react';
import React from 'react';

interface ReadingChecklistProps {
  items: string[];
}

export function ReadingChecklist({ items }: ReadingChecklistProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="ui-body text-muted-foreground">{item}</p>
        </div>
      ))}
    </div>
  );
}
