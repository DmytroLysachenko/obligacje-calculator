'use client';

import React, { useState } from 'react';
import { Check, Loader2, Share2, Target, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

interface CalculatorPageShellProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isCalculating: boolean;
  isDirty?: boolean;
  isError?: boolean;
  hasResults: boolean;
  onShare?: () => void;
  savingsGoal?: number;
  currentValue?: number;
  extraHeaderActions?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

function ShellMetaRow({
  isCalculating,
  hasResults,
}: {
  isCalculating: boolean;
  hasResults: boolean;
}) {
  const { t } = useLanguage();

  if (!isCalculating && !hasResults) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      {isCalculating ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.calculating')}
        </span>
      ) : null}
      {!isCalculating && hasResults ? (
        <span className="inline-flex items-center gap-2 text-emerald-700">
          <Check className="h-4 w-4" />
          {t('comparison.up_to_date')}
        </span>
      ) : null}
    </div>
  );
}

export const CalculatorPageShell: React.FC<CalculatorPageShellProps> = ({
  title,
  description,
  icon,
  children,
  isCalculating,
  hasResults,
  onShare,
  savingsGoal,
  currentValue,
  extraHeaderActions,
  onKeyDown,
}) => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goalProgress =
    savingsGoal && currentValue ? (currentValue / savingsGoal) * 100 : 0;
  const isGoalReached = goalProgress >= 100;
  const hasShareAction = hasResults || !!onShare;

  return (
    <div className="space-y-8 pb-20" onKeyDown={onKeyDown}>
      <header className="space-y-5 rounded-3xl border bg-card px-6 py-6 shadow-sm md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                {icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {title}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                  {description}
                </p>
              </div>
            </div>
            <ShellMetaRow
              isCalculating={isCalculating}
              hasResults={hasResults}
            />
          </div>

          {(extraHeaderActions || hasShareAction) ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {extraHeaderActions}
              {hasShareAction ? (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-2 rounded-xl text-xs font-bold',
                    copied ? 'border-emerald-600 text-emerald-700' : '',
                  )}
                  onClick={handleShare}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  {copied
                    ? t('common.copied')
                    : t('comparison.share_scenario')}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {savingsGoal && hasResults ? (
        <Card className="rounded-2xl border bg-slate-50 shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                {isGoalReached ? (
                  <Trophy className="h-5 w-5 text-amber-500" />
                ) : (
                  <Target className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold text-slate-950">
                  {isGoalReached
                    ? t('bonds.goal_reached')
                    : t('bonds.goal_progress', {
                        percent: goalProgress.toFixed(1),
                      })}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-700">
                {t('bonds.target')}:{' '}
                {new Intl.NumberFormat(
                  language === 'pl' ? 'pl-PL' : 'en-GB',
                ).format(savingsGoal)}{' '}
                PLN
              </span>
            </div>
            <Progress value={goalProgress} className="h-2" />
          </CardContent>
        </Card>
      ) : null}

      {children}
    </div>
  );
};
