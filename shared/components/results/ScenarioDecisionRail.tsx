import { CalendarDays, Landmark, Wallet } from 'lucide-react';

import { useAppI18n } from '@/i18n/client';

export function ScenarioDecisionRail({
  bondType,
  horizonLabel,
  investedLabel,
  outcomeLabel,
}: {
  bondType: string;
  horizonLabel: string;
  investedLabel: string;
  outcomeLabel: string;
}) {
  const { t } = useAppI18n();
  const items = [
    { icon: Landmark, label: t('bonds.simulation.decision_bond'), value: bondType },
    { icon: CalendarDays, label: t('bonds.simulation.decision_horizon'), value: horizonLabel },
    { icon: Wallet, label: t('bonds.simulation.decision_invested'), value: investedLabel },
  ];

  return (
    <aside
      aria-label={t('bonds.simulation.decision_summary')}
      className="border-y border-border bg-muted/20 px-4 py-4 lg:sticky lg:top-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="ui-kicker">{t('bonds.simulation.decision_summary')}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {outcomeLabel}
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex min-w-0 gap-2 border-l border-border pl-3">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="ui-kicker">{label}</dt>
                <dd className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground">
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
      <nav
        className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs font-semibold"
        aria-label={t('bonds.simulation.decision_summary')}
      >
        <a
          href="#bond-report-content"
          className="ui-focus-ring rounded-sm text-foreground hover:underline"
        >
          {t('bonds.simulation.decision_result_link')}
        </a>
        <a
          href="#bond-details"
          className="ui-focus-ring rounded-sm text-foreground hover:underline"
        >
          {t('bonds.simulation.decision_details_link')}
        </a>
      </nav>
    </aside>
  );
}
