'use client';

import React from 'react';

export function SidebarUtilityPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white/82 px-3 py-3 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.28)]">{children}</div>;
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
      <div className="space-y-2">{children}</div>
    </div>
  );
}
