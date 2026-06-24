'use client';

interface EconomicChartTooltipPayloadEntry {
  value: number;
  color: string;
}

interface EconomicChartTooltipProps {
  active?: boolean;
  payload?: EconomicChartTooltipPayloadEntry[];
  label?: string | number;
  metricLabel: string;
  minWidthClassName?: string;
}

export function EconomicChartTooltip({
  active,
  payload,
  label,
  metricLabel,
  minWidthClassName = 'min-w-[120px]',
}: EconomicChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={`${minWidthClassName} rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg`}
    >
      <p className="mb-2 border-b border-border/50 pb-1 text-sm font-semibold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {metricLabel}:
            </span>
            <span className="font-mono font-bold">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
