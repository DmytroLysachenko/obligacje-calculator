'use client';

import React from 'react';

export function SidebarUtilityRow({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="justify-self-end">{action}</div> : null}
    </div>
  );
}

export function SidebarUtilityPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="border-t border-dashed border-slate-200 px-1 py-3 first:border-t-0 first:pt-0">{children}</div>;
}

export function SidebarUtilityGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <div className="rounded-[1.6rem] border border-slate-200 bg-white px-3 py-3">
        {children}
      </div>
    </div>
  );
}
