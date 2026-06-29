'use client';

export { ComparisonTablePaginationControls } from './ComparisonTablePaginationControls';
export {
  ComparisonScenarioCell,
  MobileComparisonScenario,
  MobileComparisonValue,
} from './ComparisonTableScenarioCells';

export function ComparisonTableStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 md:border-r md:border-border last:md:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
