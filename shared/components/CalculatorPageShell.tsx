'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/i18n';
import { 
  Share2, 
  Check, 
  Info, 
  Loader2, 
  Target, 
  Trophy,
  AlertCircle
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export const CalculatorPageShell: React.FC<CalculatorPageShellProps> = ({
  title,
  description,
  icon,
  children,
  isCalculating,
  isDirty,
  isError,
  hasResults,
  onShare,
  savingsGoal,
  currentValue,
  extraHeaderActions,
  onKeyDown
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

  const goalProgress = (savingsGoal && currentValue) ? (currentValue / savingsGoal) * 100 : 0;
  const isGoalReached = goalProgress >= 100;

  return (
    <div className="space-y-8 pb-20" onKeyDown={onKeyDown}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            {icon}
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-primary uppercase">
              {title}
            </h2>
            <p className="mt-1 text-muted-foreground text-sm font-medium italic">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <div className="flex items-center gap-3">
            {isCalculating && (
              <span className="text-xs text-muted-foreground flex items-center gap-2 animate-in fade-in duration-500 bg-muted/50 px-3 py-1.5 rounded-full border">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('common.calculating')}
              </span>
            )}
            {!isCalculating && isDirty && hasResults && (
              <span className="text-xs text-orange-600 flex items-center gap-1 animate-in fade-in duration-500 font-bold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                <Info className="h-3 w-3" />
                {t('comparison.needs_recalculation')}
              </span>
            )}
            {!isCalculating && !isDirty && hasResults && (
              <span className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in duration-500 font-bold bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <Check className="h-3 w-3" />
                {t('comparison.up_to_date')}
              </span>
            )}
            {isError && (
              <span className="text-destructive text-xs font-bold flex items-center gap-1 bg-destructive/5 px-3 py-1.5 rounded-full border border-destructive/10">
                <AlertCircle className="h-3 w-3" />
                {t('common.retry')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {extraHeaderActions}
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "gap-2 text-xs font-bold border-2 transition-all",
                copied ? "border-green-600 bg-green-500 text-white" : "hover:border-primary hover:text-primary"
              )}
              onClick={handleShare}
            >
              {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
              {copied ? t('common.copied') : t('comparison.share_scenario')}
            </Button>
          </div>
        </div>
      </header>

      {/* Goal Progress Bar */}
      {savingsGoal && hasResults && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {isGoalReached ? (
                  <Trophy className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Target className="h-5 w-5 text-primary" />
                )}
                <span className="font-bold">
                  {isGoalReached 
                    ? t('bonds.goal_reached') 
                    : t('bonds.goal_progress', { percent: goalProgress.toFixed(1) })}
                </span>
              </div>
              <span className="text-sm font-black text-primary">
                {t('bonds.target')}: {new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB').format(savingsGoal)} PLN
              </span>
            </div>
            <Progress value={goalProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {children}
    </div>
  );
};
