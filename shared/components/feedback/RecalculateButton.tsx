'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppI18n } from '@/i18n/client';
interface RecalculateButtonProps {
    isDirty: boolean;
    loading: boolean;
    hasResults?: boolean;
    disabled?: boolean;
    onClick: () => void;
}
export const RecalculateButton = ({ isDirty, loading, hasResults = true, disabled = false, onClick, }: RecalculateButtonProps) => {
    const { t } = useAppI18n();
    const showButton = loading || isDirty || !hasResults;
    if (!showButton) {
        return null;
    }
    const isInitialRun = !hasResults && !loading;
    const isActionable = !loading && !disabled;
    const helperText = loading
        ? t('common.calculation_in_progress') : isInitialRun
        ? t('common.initial_calculation_hint') : t('common.recalculation_hint');
    return (<div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[min(22rem,calc(100vw-1.5rem))]">
      <div className="rounded-lg border border-border bg-background px-4 py-4 text-foreground shadow-lg shadow-foreground/10">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {isInitialRun
            ? t('common.calculate')
            : t('common.recalculate')}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {helperText}
            </p>
          </div>
          {(isDirty || isInitialRun) && !loading ? (<span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-success animate-pulse"/>) : null}
        </div>

        <div className="mt-3 sm:mt-4">
          <Button size="default" className={cn('h-11 w-full rounded-md px-5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', isActionable
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'bg-muted text-muted-foreground hover:bg-muted')} onClick={onClick} disabled={loading || disabled}>
            {loading ? (<>
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                {t('common.calculating')}
              </>) : (<>
                <RotateCcw className="mr-2 h-4 w-4"/>
                {isInitialRun ? t('common.calculate') : t('common.recalculate')}
              </>)}
          </Button>
        </div>
      </div>
    </div>);
};





