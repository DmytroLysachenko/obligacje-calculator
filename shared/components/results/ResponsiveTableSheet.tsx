'use client';

import React from 'react';
import { Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ResponsiveTableSheetProps {
  title: string;
  description: string;
  triggerLabel: string;
  triggerCount?: string;
  sheetLabel?: string;
  children: React.ReactNode;
}

export function ResponsiveTableSheet({
  title,
  description,
  triggerLabel,
  triggerCount,
  sheetLabel,
  children,
}: ResponsiveTableSheetProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={sheetLabel ?? triggerLabel}
            className="h-auto w-full justify-between border-border bg-card px-4 py-4 text-left shadow-none"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="rounded-md bg-muted p-2 text-muted-foreground">
                <Table2 className="h-4 w-4" />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block ui-truncate-flex text-sm font-semibold text-foreground">
                  {triggerLabel}
                </span>
                {triggerCount ? (
                  <span className="block ui-truncate-flex text-xs text-muted-foreground">
                    {triggerCount}
                  </span>
                ) : null}
              </span>
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="flex h-[88vh] flex-col rounded-t-lg bg-card p-0"
        >
          <SheetHeader className="border-b border-border px-5 py-5">
            <SheetTitle id={titleId} className="text-left text-lg font-semibold text-foreground">
              {title}
            </SheetTitle>
            <SheetDescription id={descriptionId} className="text-left text-sm leading-6 text-muted-foreground">
              {description}
            </SheetDescription>
          </SheetHeader>
          <div
            role="region"
            aria-labelledby={titleId}
            className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4"
          >
            <div className="space-y-3">{children}</div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
