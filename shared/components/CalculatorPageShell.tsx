'use client';
import React, { useState } from 'react';
import { Check, Loader2, Share2, Target, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { getIntlLocale } from '@/i18n/locale-utils';
interface CalculatorPageShellProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isCalculating: boolean;
    isDirty?: boolean;
    isError?: boolean;
    hasResults: boolean;
    onShare?: () => Promise<string | void> | string | void;
    savingsGoal?: number;
    currentValue?: number;
    extraHeaderActions?: React.ReactNode;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    showImplicitShare?: boolean;
}
function ShellMetaRow({ isCalculating, hasResults, }: {
    isCalculating: boolean;
    hasResults: boolean;
}) {
    const { t } = useAppI18n();
    if (!isCalculating && !hasResults) {
        return null;
    }
    return (<div className="flex flex-wrap items-center gap-3 text-[15px] leading-6 text-muted-foreground">
      {isCalculating ? (<span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin"/>
          {t('common.calculating')}
        </span>) : null}
      {!isCalculating && hasResults ? (<span className="inline-flex items-center gap-2 text-emerald-700">
          <Check className="h-4 w-4"/>
          {t('comparison.up_to_date')}
        </span>) : null}
    </div>);
}
export const CalculatorPageShell: React.FC<CalculatorPageShellProps> = ({ title, description, icon, children, isCalculating, hasResults, onShare, savingsGoal, currentValue, extraHeaderActions, onKeyDown, showImplicitShare = true, }) => {
    const { t, locale: language } = useAppI18n();
    const [copied, setCopied] = useState(false);
    const handleShare = async () => {
        try {
            const nextUrl = onShare ? await onShare() : window.location.href;
            await navigator.clipboard.writeText(nextUrl || window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (error) {
            console.error('Scenario share failed:', error);
        }
    };
    const goalProgress = savingsGoal && currentValue ? (currentValue / savingsGoal) * 100 : 0;
    const isGoalReached = goalProgress >= 100;
    const hasShareAction = onShare ? hasResults : (showImplicitShare && hasResults);
    return (<div className="space-y-9 pb-20" onKeyDown={onKeyDown}>
      <header className="surface-shell space-y-4 rounded-[1.9rem] px-5 py-5 md:space-y-5 md:rounded-3xl md:px-8 md:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-3 md:space-y-4">
            <div className="flex items-start gap-3 md:items-center md:gap-4">
              <div className="rounded-2xl bg-primary/10 p-2.5 text-primary md:p-3">
                {icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-[2rem] font-black tracking-tight text-slate-950 md:text-[2.85rem]">
                  {title}
                </h2>
                <p className="max-w-3xl text-[15px] leading-7 text-muted-foreground md:text-[17px] md:leading-8">
                  {description}
                </p>
              </div>
            </div>
            <ShellMetaRow isCalculating={isCalculating} hasResults={hasResults}/>
          </div>

          {(extraHeaderActions || hasShareAction) ? (<div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {extraHeaderActions}
              {hasShareAction ? (<Button variant="outline" size="sm" className={cn('h-10 gap-2 rounded-xl px-4 text-[12px] font-semibold focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2', copied ? 'border-emerald-600 text-emerald-700' : '')} onClick={handleShare}>
                  {copied ? (<Check className="h-3.5 w-3.5"/>) : (<Share2 className="h-3.5 w-3.5"/>)}
                  {copied
                    ? t('common.copied')
                    : t('comparison.share_scenario')}
                </Button>) : null}
            </div>) : null}
        </div>
      </header>

      {savingsGoal && hasResults ? (<Card className="surface-soft rounded-[1.6rem] md:rounded-2xl">
          <CardContent className="space-y-4 p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                {isGoalReached ? (<Trophy className="h-5 w-5 text-amber-500"/>) : (<Target className="h-5 w-5 text-primary"/>)}
                <span className="text-[15px] font-semibold text-slate-950 md:text-base">
                  {isGoalReached
                ? t('bonds.goal_reached')
                : t('bonds.goal_progress', {
                    percent: goalProgress.toFixed(1),
                })}
                </span>
              </div>
                <span className="text-[15px] font-semibold text-slate-700 md:text-base">
                {t('bonds.target')}:{' '}
                {new Intl.NumberFormat(getIntlLocale(language)).format(savingsGoal)}{' '}
                PLN
              </span>
            </div>
            <Progress value={goalProgress} className="h-2.5"/>
          </CardContent>
        </Card>) : null}

      {children}
    </div>);
};





