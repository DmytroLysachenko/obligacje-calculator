'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';
import { pickLanguageValue } from '@/i18n/locale-utils';

interface RecalculateButtonProps {
    isDirty: boolean;
    loading: boolean;
    hasResults?: boolean;
    disabled?: boolean;
    onClick: () => void;
}
export const RecalculateButton = ({ isDirty, loading, hasResults = true, disabled = false, onClick, }: RecalculateButtonProps) => {
    const { t, language } = useLanguage();
    const showButton = loading || isDirty || !hasResults;
    if (!showButton) {
        return null;
    }
    const isInitialRun = !hasResults && !loading;
    const isActionable = !loading && !disabled;
    const helperText = loading
        ? pickLanguageValue(language, {
            pl: 'Liczenie jest w toku.',
            en: 'Calculation is in progress.'
        }) : isInitialRun
        ? pickLanguageValue(language, {
            pl: 'Uruchom pierwsze czyste przeliczenie po ustawieniu scenariusza.',
            en: 'Run the first clean calculation after setting your scenario.'
        }) : pickLanguageValue(language, {
        pl: 'Masz nowe dane wejsciowe. Przelicz dopiero, gdy scenariusz jest gotowy.',
        en: 'New inputs are staged. Recalculate only when the scenario is ready.'
    });
    return (<div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(22rem,calc(100vw-1.5rem))]">
      <div className="rounded-[1.55rem] border border-slate-950/10 bg-slate-950 px-4 py-4 text-white shadow-2xl shadow-slate-950/20 sm:rounded-[1.75rem]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white/65">
              {isInitialRun
            ? t('common.calculate')
            : t('common.recalculate')}
            </p>
            <p className="text-[14px] leading-6 text-white/85 sm:text-[15px] sm:leading-6">
              {helperText}
            </p>
          </div>
          {(isDirty || isInitialRun) && !loading ? (<span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 animate-pulse"/>) : null}
        </div>

        <div className="mt-3 sm:mt-4">
          <Button size="default" className={cn('h-11 w-full rounded-2xl px-5 text-[13px] font-semibold sm:text-sm focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950', isActionable
            ? 'bg-white text-slate-950 hover:bg-white/90'
            : 'bg-white/15 text-white/70 hover:bg-white/15')} onClick={onClick} disabled={loading || disabled}>
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
