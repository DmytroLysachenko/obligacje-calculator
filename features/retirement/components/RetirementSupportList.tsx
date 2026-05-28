'use client';

import React from 'react';

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
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-slate-200 pb-3">
        <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
          {title}
        </h4>
        <span className="text-xs font-semibold text-slate-500">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm leading-6 text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="space-y-0 divide-y divide-dashed divide-slate-200 rounded-[1.5rem] border border-slate-200 bg-white">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="px-4 py-3 text-sm leading-6 text-slate-600">
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
