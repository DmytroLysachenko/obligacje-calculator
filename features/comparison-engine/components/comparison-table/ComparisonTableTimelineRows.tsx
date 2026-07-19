'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollHint,
} from '@/components/ui/table';
import { ComparisonTableTimelineRowsProps } from '@/features/comparison-engine/types/comparison-table';
import { cn } from '@/lib/utils';
import { ResponsiveTableSheet } from '@/shared/components/results/ResponsiveTableSheet';

import {
  ComparisonScenarioCell,
  MobileComparisonScenario,
  MobileComparisonValue,
} from './ComparisonTableParts';

export function ComparisonTableTimelineRows({
  rows,
  bondTypeA,
  bondTypeB,
  higherColumnLabel,
  higherBadgeSuffix,
  tieLabel,
  formatCurrency,
  labels,
}: ComparisonTableTimelineRowsProps) {
  const scenarioLabels = {
    nominal: labels.nominal,
    real: labels.real,
    profit: labels.profit,
  };

  return (
    <>
      <ResponsiveTableSheet
        title={labels.mobileTitle}
        description={labels.mobileDescription}
        triggerLabel={labels.mobileTrigger}
        triggerCount={labels.mobileCount}
      >
        <div className="ui-divider-group">
          {rows.map((row) => (
            <article
              key={`mobile-compare-${row.key}`}
              className="py-5 first:pt-0"
              aria-label={row.label}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{row.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.dateLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MobileComparisonScenario
                  label={`${bondTypeA} (A)`}
                  snapshot={row.scenarioA}
                  formatCurrency={formatCurrency}
                  labels={scenarioLabels}
                />
                <MobileComparisonScenario
                  label={`${bondTypeB} (B)`}
                  snapshot={row.scenarioB}
                  formatCurrency={formatCurrency}
                  labels={scenarioLabels}
                />
              </div>
              <MobileComparisonValue
                label={higherColumnLabel}
                value={
                  row.leader === 'tie'
                    ? tieLabel
                    : `${row.leader === 'A' ? bondTypeA : bondTypeB} ${formatCurrency(Math.abs(row.gap))}`
                }
              />
            </article>
          ))}
        </div>
      </ResponsiveTableSheet>

      <div className="ui-table-frame hidden lg:block">
        <div className="ui-section-header border-b border-border px-4 py-3 text-sm text-muted-foreground">
          <p>{labels.desktopNote}</p>
          <p className="text-sm font-semibold text-muted-foreground">{labels.mobileCount}</p>
        </div>

        <div>
          <TableScrollHint>{labels.mobileDescription}</TableScrollHint>
          <Table className="w-full table-fixed tabular-nums" aria-label={labels.desktopNote}>
            <TableCaption>{labels.desktopNote}</TableCaption>
            <TableHeader className="bg-card">
              <TableRow className="border-b hover:bg-transparent">
                <TableHead
                  scope="col"
                  className="sticky left-0 top-0 z-10 h-12 w-[22%] bg-card px-4 text-xs font-semibold text-muted-foreground"
                >
                  {labels.year}
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 h-12 w-[28%] bg-card px-4 text-xs font-semibold text-foreground"
                >
                  {bondTypeA} (A)
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 h-12 w-[28%] bg-card px-4 text-xs font-semibold text-foreground"
                >
                  {bondTypeB} (B)
                </TableHead>
                <TableHead
                  scope="col"
                  className="sticky top-0 z-10 h-12 w-[22%] bg-card px-4 text-right text-xs font-semibold text-muted-foreground"
                >
                  {higherColumnLabel}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const higherScenario = row.leader === 'tie' ? null : row.leader;

                return (
                  <TableRow
                    key={row.key}
                    className="border-b border-border transition-colors odd:bg-muted/20 hover:bg-muted/35"
                  >
                    <TableCell className="sticky left-0 z-10 bg-inherit px-4 py-5 font-semibold text-foreground">
                      <div className="space-y-1">
                        <p>{row.label}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {row.dateLabel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-4 py-4',
                        higherScenario === 'A' ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <ComparisonScenarioCell
                        snapshot={row.scenarioA}
                        formatCurrency={formatCurrency}
                        labels={scenarioLabels}
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-4 py-4',
                        higherScenario === 'B' ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <ComparisonScenarioCell
                        snapshot={row.scenarioB}
                        formatCurrency={formatCurrency}
                        labels={scenarioLabels}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      {higherScenario ? (
                        <div className="space-y-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'border px-3 py-0.5 text-xs font-semibold',
                              higherScenario === 'A'
                                ? 'border-border bg-card text-foreground'
                                : 'border-success/30 bg-success/10 text-success',
                            )}
                          >
                            {higherScenario === 'A' ? bondTypeA : bondTypeB} {higherBadgeSuffix}
                          </Badge>
                          <p className="font-mono text-xs font-semibold text-foreground">
                            {formatCurrency(Math.abs(row.gap))}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          {tieLabel}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
