'use client';

import { Badge } from '@/components/ui/badge';
import { ComparisonTableSummaryGridProps } from '@/features/comparison-engine/types/comparison-table';
import { cn } from '@/lib/utils';

export function ComparisonTableSummaryGrid({
  rows,
  bondTypeA,
  bondTypeB,
  tieLabel,
  formatCurrency,
}: ComparisonTableSummaryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-dashed px-6 py-5 md:grid-cols-3">
      {rows.map((row) => {
        const higherScenario = row.a === row.b ? null : row.a > row.b ? 'A' : 'B';

        return (
          <div key={row.label} className="bg-muted/30 px-4 py-3">
            <p className="text-sm font-semibold text-muted-foreground">{row.label}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">
                  {bondTypeA}: <span className="font-mono">{formatCurrency(row.a)}</span>
                </p>
                <p className="font-semibold text-foreground">
                  {bondTypeB}: <span className="font-mono">{formatCurrency(row.b)}</span>
                </p>
              </div>
              {higherScenario ? (
                <Badge
                  variant="outline"
                  className={cn(
                    'border px-3 py-1 text-xs font-semibold',
                    higherScenario === 'A'
                      ? 'border-border bg-card text-foreground'
                      : 'border-success/30 bg-success/10 text-success',
                  )}
                >
                  {higherScenario === 'A' ? bondTypeA : bondTypeB}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-border bg-muted text-xs font-semibold text-muted-foreground"
                >
                  {tieLabel}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
