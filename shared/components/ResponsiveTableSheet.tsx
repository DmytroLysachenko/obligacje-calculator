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
            className="w-full justify-between rounded-2xl border-slate-200 bg-white px-4 py-5 text-left shadow-none"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                <Table2 className="h-4 w-4" />
              </span>
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-slate-950">
                  {triggerLabel}
                </span>
                {triggerCount ? (
                  <span className="block text-xs text-slate-500">
                    {triggerCount}
                  </span>
                ) : null}
              </span>
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[88vh] rounded-t-[2rem] bg-white p-0">
          <SheetHeader className="border-b border-slate-200 px-5 py-5">
            <SheetTitle className="text-left text-lg font-black text-slate-950">
              {title}
            </SheetTitle>
            <SheetDescription className="text-left text-sm leading-6 text-slate-600">
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
