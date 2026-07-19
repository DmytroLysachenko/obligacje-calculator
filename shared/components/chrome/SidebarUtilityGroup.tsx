'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export function SidebarUtilityRow({
  title,
  description,
  action,
  emphasis = false,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className={emphasis ? 'ui-label' : 'ui-value-label'}>{title}</p>
        {description ? (
          <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="justify-self-end">{action}</div> : null}
    </div>
  );
}

export function SidebarUtilityPanel({
  children,
  flush = false,
}: {
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <div
      className={
        flush ? 'first:border-t-0' : 'border-t border-border py-3.5 first:border-t-0 first:pt-0'
      }
    >
      {children}
    </div>
  );
}

export function SidebarUtilityStack({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-border" role="group">
      {children}
    </div>
  );
}

export function SidebarUtilityGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5" aria-label={title}>
      <p className="ui-kicker px-0.5">{title}</p>
      <div className="border-y border-border py-1">{children}</div>
    </section>
  );
}
