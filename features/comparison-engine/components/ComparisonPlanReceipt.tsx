'use client';

import { ChevronUp, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { comparisonLayout } from './comparison-layout';

export interface ComparisonPlanSummaryItem {
  label: string;
  value: string;
}

interface ComparisonPlanReceiptProps {
  closeLabel: string;
  editLabel: string;
  isOpen: boolean;
  planLabel: string;
  summary: ComparisonPlanSummaryItem[];
  onOpenChange: (open: boolean) => void;
}

/** Keeps the comparison plan's collapsed receipt separate from input ownership. */
export function ComparisonPlanReceipt({
  closeLabel,
  editLabel,
  isOpen,
  planLabel,
  summary,
  onOpenChange,
}: ComparisonPlanReceiptProps) {
  if (isOpen) {
    return (
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
        >
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          {closeLabel}
        </Button>
      </div>
    );
  }

  return (
    <section className={comparisonLayout.planReceipt} aria-label={planLabel}>
      <div className="border-y border-border bg-muted/15 px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-3">
            <p className="ui-kicker">{planLabel}</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:items-start">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 border-l border-border pl-3 first:border-l-0 first:pl-0"
                >
                  <dt className="ui-kicker">{item.label}</dt>
                  <dd className="mt-1 truncate text-sm font-semibold text-foreground">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-2 self-start"
            onClick={() => onOpenChange(true)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {editLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
