'use client';

import React from 'react';

export function ChartSupportNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p>
    </div>
  );
}
