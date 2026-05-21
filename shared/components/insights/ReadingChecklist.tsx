'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ReadingChecklistProps {
  items: string[];
}

export function ReadingChecklist({ items }: ReadingChecklistProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm leading-7 text-slate-600">{item}</p>
        </div>
      ))}
    </div>
  );
}
