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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
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
  return <div className="border-t border-border py-3 first:border-t-0 first:pt-0">{children}</div>;
}

export function SidebarUtilityGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </p>
      <div className="border-y border-border py-1">
        {children}
      </div>
    </section>
  );
}
