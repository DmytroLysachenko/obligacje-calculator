'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  label: string;
  emphasis?: 'primary' | 'secondary' | 'reference';
  className?: string;
}

const emphasisClass = {
  primary: 'hover:border-foreground/40',
  secondary: 'hover:border-muted-foreground/40',
  reference: 'hover:border-primary/40',
} as const;

export function ToolCard({
  href,
  title,
  description,
  icon,
  label,
  emphasis = 'secondary',
  className,
}: ToolCardProps) {
  return (
    <Link href={href} className="block h-full rounded-lg ui-focus-ring">
      <article
        className={cn(
          'group flex h-full flex-col gap-5 border-t border-border py-5 transition-colors',
          emphasisClass[emphasis],
          className,
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'rounded-md p-2.5',
              emphasis === 'primary'
                ? 'bg-foreground text-background'
                : 'bg-muted text-foreground',
            )}
          >
            {icon}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="ui-section-title ui-safe-text">{title}</h3>
          <p className="ui-body ui-safe-text max-w-xl text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="ui-safe-text">{label}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </article>
    </Link>
  );
}

interface SectionHeadingProps {
  title: string;
  description: string;
  className?: string;
}

export function SectionHeading({ title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h2 className="ui-section-title ui-safe-text">{title}</h2>
      <p className="ui-body ui-safe-text max-w-3xl text-muted-foreground">{description}</p>
    </div>
  );
}
