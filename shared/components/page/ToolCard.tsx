'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

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
  primary: 'border-foreground/30 hover:border-foreground/60',
  secondary: 'border-border hover:border-muted-foreground/50',
  reference: 'border-primary/30 hover:border-primary/60',
} as const;

const iconAccentClass = {
  primary: 'border-foreground text-foreground',
  secondary: 'border-border text-foreground',
  reference: 'border-primary/50 text-foreground',
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
          'ui-interactive-surface group flex h-full flex-col gap-5 border-t py-5',
          emphasisClass[emphasis],
          className,
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn('border-l-2 pl-3 pt-0.5', iconAccentClass[emphasis])}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="ui-section-title ui-safe-text ui-balance">{title}</h3>
          <p className="ui-body ui-safe-text ui-pretty max-w-xl text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="ui-safe-text">{label}</span>
          <ArrowRight
            className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
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
    <div className={cn('ui-section-intro', className)}>
      <h2 className="ui-section-title ui-safe-text">{title}</h2>
      <p className="ui-body ui-safe-text ui-pretty text-muted-foreground">{description}</p>
    </div>
  );
}
