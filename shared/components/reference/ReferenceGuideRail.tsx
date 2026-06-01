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
    <AccordionItem value={value} className="border-b border-border px-0 last:border-b-0">
      <AccordionTrigger className="py-4 text-left hover:no-underline">
        <div className="flex items-center gap-2">
          {icon}
          <p className="ui-card-title">{title}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-5 pt-1">{children}</AccordionContent>
    </AccordionItem>
  );
}
