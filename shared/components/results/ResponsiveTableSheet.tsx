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
  children: React.ReactNode;
}

export function ResponsiveTableSheet({
  title,
  description,
  triggerLabel,
  triggerCount,
  children,
}: ResponsiveTableSheetProps) {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between border-border bg-card px-4 py-4 text-left shadow-none"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-md bg-muted p-2 text-muted-foreground">
                <Table2 className="h-4 w-4" />
              </span>
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-foreground">
                  {triggerLabel}
                </span>
                {triggerCount ? (
                  <span className="block text-xs text-muted-foreground">
                    {triggerCount}
                  </span>
                ) : null}
              </span>
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[88vh] rounded-t-lg bg-card p-0">
          <SheetHeader className="border-b border-border px-5 py-5">
            <SheetTitle className="text-left text-lg font-semibold text-foreground">
              {title}
            </SheetTitle>
            <SheetDescription className="text-left text-sm leading-6 text-muted-foreground">
              {description}
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-8 pt-4">
            <div className="space-y-3">{children}</div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
