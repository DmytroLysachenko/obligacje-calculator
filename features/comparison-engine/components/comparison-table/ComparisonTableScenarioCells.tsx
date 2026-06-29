'use client';

import { Badge } from '@/components/ui/badge';
import { ComparisonScenarioSnapshot } from '@/features/comparison-engine/lib/comparison-table-model';
import { cn } from '@/lib/utils';

interface ScenarioMetricLabels {
  nominal: string;
  real: string;
  profit: string;
}

interface ScenarioSnapshotProps {
  snapshot: ComparisonScenarioSnapshot;
  formatCurrency: (val: number) => string;
  labels: ScenarioMetricLabels;
}

export function MobileComparisonValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-dashed border-border px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ComparisonScenarioCell({
  snapshot,
  formatCurrency,
  labels,
}: ScenarioSnapshotProps) {
  return (
    <div className="space-y-3 text-xs">
      <ScenarioEventBadges labels={snapshot.eventLabels} className="flex flex-wrap gap-1" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ScenarioSnapshotMetric
          label={labels.nominal}
          value={formatCurrency(snapshot.nominalValue)}
          strong
        />
        <ScenarioSnapshotMetric label={labels.real} value={formatCurrency(snapshot.realValue)} />
        <ScenarioSnapshotMetric
          label={labels.profit}
          value={formatCurrency(snapshot.netProfit)}
          tone={snapshot.netProfit >= 0 ? 'positive' : 'negative'}
        />
      </div>
      <ScenarioRateSummary
        snapshot={snapshot}
        className="border-t border-dashed border-border pt-2"
      />
    </div>
  );
}

export function MobileComparisonScenario({
  label,
  snapshot,
  formatCurrency,
  labels,
}: {
  label: string;
} & ScenarioSnapshotProps) {
  return (
    <div className="border-t border-dashed border-border px-1 py-2 first:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <ScenarioEventBadges labels={snapshot.eventLabels} className="mt-2 flex flex-wrap gap-1" />
      <div className="mt-2 grid grid-cols-1 gap-2">
        <ScenarioSnapshotMetric
          label={labels.nominal}
          value={formatCurrency(snapshot.nominalValue)}
          strong
        />
        <ScenarioSnapshotMetric label={labels.real} value={formatCurrency(snapshot.realValue)} />
        <ScenarioSnapshotMetric
          label={labels.profit}
          value={formatCurrency(snapshot.netProfit)}
          tone={snapshot.netProfit >= 0 ? 'positive' : 'negative'}
        />
      </div>
      <ScenarioRateSummary
        snapshot={snapshot}
        asParagraph
        className="mt-2 border-t border-dashed border-border pt-2"
      />
    </div>
  );
}

function ScenarioEventBadges({ labels, className }: { labels: string[]; className: string }) {
  if (labels.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {labels.map((label) => (
        <Badge key={label} variant="secondary" className="h-5 px-2 text-[10px] font-semibold">
          {label}
        </Badge>
      ))}
    </div>
  );
}

function ScenarioRateSummary({
  snapshot,
  className,
  asParagraph = false,
}: {
  snapshot: ComparisonScenarioSnapshot;
  className: string;
  asParagraph?: boolean;
}) {
  if (snapshot.interestRate === undefined && !snapshot.rateSourceLabel) {
    return null;
  }

  const content = (
    <>
      {snapshot.interestRate !== undefined ? (
        <span className="font-semibold text-foreground">{snapshot.interestRate.toFixed(2)}%</span>
      ) : null}
      {snapshot.rateSourceLabel ? <span className="ml-2">{snapshot.rateSourceLabel}</span> : null}
    </>
  );
  const classes = cn(className, 'text-[11px] leading-5 text-muted-foreground');

  if (asParagraph) {
    return <p className={classes}>{content}</p>;
  }

  return <div className={classes}>{content}</div>;
}

function ScenarioSnapshotMetric({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-mono text-xs',
          strong ? 'font-semibold text-foreground' : 'text-muted-foreground',
          tone === 'positive' ? 'financial-positive' : '',
          tone === 'negative' ? 'text-destructive' : '',
        )}
      >
        {value}
      </p>
    </div>
  );
}
