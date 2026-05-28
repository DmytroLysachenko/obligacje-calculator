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
          ? 'space-y-3 rounded-[1.6rem] border border-amber-200 bg-amber-50/55 px-4 py-4 shadow-none'
          : 'space-y-3 rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-none'
      }
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-lg font-black tracking-tight text-slate-950">{title}</p>
      </div>
      <p className="text-sm leading-7 text-slate-600">{description}</p>
    </section>
  );
}
