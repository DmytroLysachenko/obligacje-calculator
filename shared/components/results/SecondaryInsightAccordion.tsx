'use client';

import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface SecondaryInsightAccordionProps {
  title: string;
  description: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SecondaryInsightAccordion({
  title,
  description,
  badge,
  defaultOpen = false,
  children,
  className,
  contentClassName,
}: SecondaryInsightAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? 'content' : ''}
      className={className}
    >
      <AccordionItem value="content" className="surface-panel overflow-hidden">
        <AccordionTrigger className="px-4 py-4 text-left hover:no-underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 md:px-5">
          <span className="flex min-w-0 flex-1 items-start justify-between gap-4 pr-4 text-left">
            <span className="min-w-0 space-y-1.5">
              <span className="block ui-card-title">{title}</span>
              <span className="block max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </span>
            </span>
            {badge ? <span className="surface-chip mt-0.5 shrink-0">{badge}</span> : null}
          </span>
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            'border-t border-border px-4 pb-4 pt-4 text-sm leading-6 text-muted-foreground md:px-5',
            contentClassName,
          )}
        >
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
