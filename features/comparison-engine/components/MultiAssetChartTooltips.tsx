'use client';

import { useAppI18n } from '@/i18n/client';

import { MultiAssetDrawdownTooltipProps, MultiAssetGrowthTooltipProps } from '../types/multi-asset';

export function MultiAssetGrowthTooltip({
  active,
  payload,
  label,
  formatCurrency,
}: MultiAssetGrowthTooltipProps) {
  const { t } = useAppI18n();
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const inflation = data.inflation;
  const nbp = data.nbp;

  return (
    <div
      className="min-w-[220px] rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="status"
    >
      <p className="ui-metadata mb-3 border-b border-border/50 pb-2 font-semibold">{label}</p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          {payload
            .filter(
              (entry) =>
                entry.dataKey &&
                !String(entry.dataKey).includes('_drawdown') &&
                !['inflation', 'nbp'].includes(String(entry.dataKey)),
            )
            .map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 text-xs tabular-nums"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                  {entry.name}:
                </span>
                <span className="font-mono font-semibold text-primary">
                  {formatCurrency(Number(entry.value))}
                </span>
              </div>
            ))}
        </div>

        {inflation !== undefined || nbp !== undefined ? (
          <div className="mt-2 space-y-1.5 border-t border-dashed border-border/50 pt-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('common.context_rates')}
            </p>
            {inflation !== undefined ? (
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  <span className="font-medium text-muted-foreground">
                    {t('bonds.ref_inflation')}:
                  </span>
                </span>
                <span className="font-semibold text-warning">{Number(inflation).toFixed(2)}%</span>
              </div>
            ) : null}
            {nbp !== undefined ? (
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {t('bonds.nbp_rate_short')}:
                  </span>
                </span>
                <span className="font-semibold text-primary">{Number(nbp).toFixed(2)}%</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MultiAssetDrawdownTooltip({
  active,
  payload,
  label,
}: MultiAssetDrawdownTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="min-w-[180px] rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      role="status"
    >
      <p className="ui-metadata mb-2 border-b border-border/50 pb-1 font-semibold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs tabular-nums">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-destructive">
              -{Number(entry.value).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
