'use client';
import React, { useState } from 'react';
import { Check, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { pageLayout } from './layout-system';
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
    return (<div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-muted-foreground">
      {isCalculating ? (<span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin"/>
          {t('common.calculating')}
        </span>) : null}
      {!isCalculating && hasResults ? (<span className="inline-flex items-center gap-2 text-success">
          <Check className="h-4 w-4"/>
          {t('common.results_up_to_date')}
        </span>) : null}
    </div>);
}
export const CalculatorPageShell: React.FC<CalculatorPageShellProps> = ({ title, description, icon, children, isCalculating, hasResults, onShare, extraHeaderActions, onKeyDown, showImplicitShare = true, }) => {
    const { t } = useAppI18n();
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
    const hasShareAction = onShare ? hasResults : (showImplicitShare && hasResults);
    return (<div className={pageLayout.pageFlow} onKeyDown={onKeyDown}>
      <header className="space-y-4 border-b border-border pb-8 md:pb-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[var(--layout-reading-max)] space-y-2">
            <div className="flex items-start gap-3 md:items-center">
              <div className="rounded-md bg-muted p-2 text-foreground">
                {icon}
              </div>
              <div className="space-y-1">
                <h2 className="ui-page-title">
                  {title}
                </h2>
                <p className="ui-body text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            <ShellMetaRow isCalculating={isCalculating} hasResults={hasResults}/>
          </div>

          {(extraHeaderActions || hasShareAction) ? (<div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {extraHeaderActions}
              {hasShareAction ? (<Button variant="outline" size="sm" className={cn('h-8 gap-2 px-3 text-xs font-medium', copied ? 'border-[var(--finance-success)] text-[var(--finance-success)]' : '')} onClick={handleShare}>
                  {copied ? (<Check className="h-3.5 w-3.5"/>) : (<Share2 className="h-3.5 w-3.5"/>)}
                  {copied
                    ? t('common.copied')
                    : t('comparison.share_scenario')}
                </Button>) : null}
            </div>) : null}
        </div>
      </header>

      {children}
    </div>);
};





