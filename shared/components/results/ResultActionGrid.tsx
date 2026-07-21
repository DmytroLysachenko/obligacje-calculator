'use client';

import { FileSpreadsheet, FileText } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

export type ResultActionKind = 'primary' | 'secondary' | 'csv' | 'pdf';

export interface ResultAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline';
  disabled?: boolean;
  kind?: ResultActionKind;
  priority?: 'primary' | 'secondary';
}

interface ResultActionGridProps {
  actions: ResultAction[];
  className?: string;
}

const actionKindClass: Record<ResultActionKind, string> = {
  primary: '',
  secondary: 'border-border bg-card text-foreground',
  csv: 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
  pdf: 'border-border bg-card text-foreground hover:border-warning/40 hover:bg-warning/5',
};

function DefaultActionIcon({ kind }: { kind?: ResultActionKind }) {
  if (kind === 'csv') {
    return <FileSpreadsheet className="h-4 w-4" />;
  }
  if (kind === 'pdf') {
    return <FileText className="h-4 w-4" />;
  }
  return null;
}

export const ResultActionGrid = React.memo(function ResultActionGrid({
  actions,
  className,
}: ResultActionGridProps) {
  const { t } = useAppI18n();
  if (!actions.length) {
    return null;
  }

  const primaryActions = actions.filter((action) => action.priority !== 'secondary');
  const secondaryActions = actions.filter((action) => action.priority === 'secondary');

  return (
    <div
      className={cn(
        'grid min-w-0 grid-cols-1 gap-2 border-t border-border bg-muted/30 p-4 sm:grid-cols-2 lg:w-[380px] lg:shrink-0 lg:border-l lg:border-t-0',
        className,
      )}
      aria-label={t('bonds.results.actions_label')}
    >
      {primaryActions.map((action) => {
        const kind = action.kind ?? (action.variant === 'default' ? 'primary' : 'secondary');
        const variant = action.variant ?? (kind === 'primary' ? 'default' : 'outline');

        return (
          <Button
            type="button"
            key={action.label}
            variant={variant}
            className={cn(
              'h-10 min-w-0 justify-center gap-2 px-3 text-xs font-semibold ui-focus-ring',
              variant === 'outline' ? actionKindClass[kind] : '',
            )}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <span className="shrink-0" aria-hidden={!action.icon}>
              {action.icon ?? <DefaultActionIcon kind={kind} />}
            </span>
            <span className="ui-truncate-flex">{action.label}</span>
          </Button>
        );
      })}
      {secondaryActions.length ? (
        <details className="col-span-full border-t border-border pt-2">
          <summary className="ui-focus-ring cursor-pointer rounded-sm text-xs font-semibold text-muted-foreground">
            {t('bonds.results.more_actions')}
          </summary>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {secondaryActions.map((action) => {
              const kind = action.kind ?? 'secondary';
              return (
                <Button
                  type="button"
                  key={action.label}
                  variant="outline"
                  className={cn(
                    'h-10 min-w-0 justify-center gap-2 px-3 text-xs font-semibold ui-focus-ring',
                    actionKindClass[kind],
                  )}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  <span className="shrink-0" aria-hidden={!action.icon}>
                    {action.icon ?? <DefaultActionIcon kind={kind} />}
                  </span>
                  <span className="ui-truncate-flex">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
});
