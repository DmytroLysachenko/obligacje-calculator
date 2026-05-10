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
      <AccordionItem
        value="content"
        className="surface-panel rounded-[2rem]"
      >
        <AccordionTrigger className="rounded-[2rem] px-5 py-5 hover:no-underline md:px-6">
          <div className="flex min-w-0 flex-1 items-start justify-between gap-4 pr-4 text-left">
            <div className="min-w-0 space-y-2">
              <p className="text-lg font-black tracking-tight text-slate-950">
                {title}
              </p>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                {description}
              </p>
            </div>
            {badge ? (
              <span className="surface-chip mt-0.5 shrink-0 px-2.5 py-1 text-slate-500">
                {badge}
              </span>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent className={cn('px-5 pb-5 md:px-6', contentClassName)}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
