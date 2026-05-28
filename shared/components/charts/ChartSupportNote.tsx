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
    <div className="border-t border-dashed border-slate-200 px-1 pt-3">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p>
    </div>
  );
}
