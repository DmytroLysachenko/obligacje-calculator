'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card
      className={
        tone === 'warning'
          ? 'rounded-[1.6rem] border-amber-200 bg-amber-50/70 shadow-none'
          : 'rounded-[1.6rem] border-slate-200 bg-white shadow-none'
      }
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-lg font-black tracking-tight text-slate-950">{title}</p>
        </div>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}
