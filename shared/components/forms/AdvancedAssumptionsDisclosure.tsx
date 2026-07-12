'use client';

import { Settings2 } from 'lucide-react';
import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface AdvancedAssumptionsDisclosureProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AdvancedAssumptionsDisclosure({
  title,
  description,
  children,
}: AdvancedAssumptionsDisclosureProps) {
  return (
    <Accordion type="single" collapsible defaultValue="">
      <AccordionItem value="advanced-assumptions" className="border-0">
        <AccordionTrigger className="border-0 border-b border-border px-0 py-4 hover:no-underline">
          <span className="flex items-start gap-3 text-left">
            <span className="border-l-2 border-border pl-3 pt-0.5 text-muted-foreground">
              <Settings2 className="h-4 w-4" />
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-foreground">{title}</span>
              <span className="block max-w-2xl text-xs font-medium leading-5 text-muted-foreground">
                {description}
              </span>
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-6 pt-4">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
