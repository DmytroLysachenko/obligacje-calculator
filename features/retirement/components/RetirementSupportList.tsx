'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RetirementSupportListProps {
  title: string;
  items: string[];
  emptyLabel: string;
}

export function RetirementSupportList({
  title,
  items,
  emptyLabel,
}: RetirementSupportListProps) {
  return (
    <Card className="rounded-2xl border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        {items.length === 0 ? (
          <p>{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              {item}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
