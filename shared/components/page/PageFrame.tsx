'use client';

import React from 'react';

import { cn } from '@/lib/utils';

import { pageLayout } from './layout-system';

interface PageFrameProps {
  children: React.ReactNode;
  width?: 'wide' | 'content' | 'reading';
  flow?: 'page' | 'compact' | 'section' | 'none';
  className?: string;
}

const widthClass = {
  wide: pageLayout.shell,
  content: pageLayout.content,
  reading: pageLayout.reading,
} as const;

const flowClass = {
  page: pageLayout.pageFlow,
  compact: pageLayout.compactFlow,
  section: pageLayout.sectionFlow,
  none: '',
} as const;

export function PageFrame({ children, width = 'wide', flow = 'page', className }: PageFrameProps) {
  return <div className={cn(widthClass[width], flowClass[flow], className)}>{children}</div>;
}

interface SectionBlockProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  headerClassName?: string;
  divided?: boolean;
  surface?: boolean;
  variant?: 'plain' | 'divided' | 'surface' | 'card';
}

export function SectionBlock({
  children,
  title,
  description,
  className,
  headerClassName,
  divided = false,
  surface = false,
  variant = surface ? 'card' : divided ? 'divided' : 'plain',
}: SectionBlockProps) {
  const isDivided = divided || variant === 'divided';
  const isSurface = surface || variant === 'surface';
  const isCard = variant === 'card';

  return (
    <section
      className={cn(
        pageLayout.sectionFlow,
        isDivided && pageLayout.sectionDivider,
        isSurface && 'rounded-lg bg-muted/25 p-5 md:p-6',
        isCard && 'rounded-lg border border-border bg-card p-5 shadow-sm md:p-6',
        className,
      )}
    >
      {title || description ? (
        <div
          className={cn(
            'space-y-2',
            (isSurface || isCard) && 'border-b border-border pb-4',
            headerClassName,
          )}
        >
          {title ? <h2 className="ui-section-title">{title}</h2> : null}
          {description ? (
            <p className="ui-body max-w-[var(--layout-reading-max)] text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
