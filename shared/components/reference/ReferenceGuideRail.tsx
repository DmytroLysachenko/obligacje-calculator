'use client';

import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ReferenceGuideRailProps {
  value: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export function ReferenceGuideRail({
  value,
  icon,
  title,
  children,
}: ReferenceGuideRailProps) {
  return (
    <AccordionItem value={value} className="rounded-lg border border-border bg-card px-5 shadow-none">
      <AccordionTrigger className="py-4 text-left hover:no-underline">
        <div className="flex items-center gap-2">
          {icon}
          <p className="ui-card-title">{title}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 border-t border-dashed border-border pb-5 pt-4">{children}</AccordionContent>
    </AccordionItem>
  );
}
