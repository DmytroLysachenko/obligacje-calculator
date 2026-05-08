'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Loader2,
  Share2,
  Target,
  Trophy,
} from 'lucide-react';
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

const ShellStatusChip = ({
  label,
  icon,
  tone,
}: {
  label: string;
  icon: React.ReactNode;
  tone: 'neutral' | 'success' | 'warning';
}) => {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-destructive/10 bg-destructive/5 text-destructive'
        : 'border-slate-200 bg-muted/50 text-muted-foreground';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold',
        toneClass,
      )}
    >
      {icon}
      {label}
    </span>
  );
};

export const CalculatorPageShell: React.FC<CalculatorPageShellProps> = ({
  title,
  description,
  icon,
  children,
  isCalculating,
  isError,
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
      <header className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                {icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase tracking-tight text-primary">
                  {title}
                </h2>
                <p className="text-sm font-medium italic text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isCalculating ? (
                <ShellStatusChip
                  label={t('common.calculating')}
                  icon={<Loader2 className="h-3 w-3 animate-spin" />}
                  tone="neutral"
                />
              ) : null}
              {!isCalculating && hasResults ? (
                <ShellStatusChip
                  label={t('comparison.up_to_date')}
                  icon={<Check className="h-3 w-3" />}
                  tone="success"
                />
              ) : null}
              {isError ? (
                <ShellStatusChip
                  label={t('common.retry')}
                  icon={<AlertCircle className="h-3 w-3" />}
                  tone="warning"
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            {extraHeaderActions ? (
              <div className="flex flex-wrap items-center gap-2">
                {extraHeaderActions}
              </div>
            ) : null}

            {hasShareAction ? (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-2 border-2 text-xs font-bold transition-all',
                  copied
                    ? 'border-green-600 bg-green-500 text-white'
                    : 'hover:border-primary hover:text-primary',
                )}
                onClick={handleShare}
              >
                {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                {copied ? t('common.copied') : t('comparison.share_scenario')}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {savingsGoal && hasResults ? (
        <Card className="overflow-hidden border-2 border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                {isGoalReached ? (
                  <Trophy className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Target className="h-5 w-5 text-primary" />
                )}
                <span className="font-bold">
                  {isGoalReached
                    ? t('bonds.goal_reached')
                    : t('bonds.goal_progress', {
                        percent: goalProgress.toFixed(1),
                      })}
                </span>
              </div>
              <span className="text-sm font-black text-primary">
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
