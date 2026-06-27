'use client';

import { Check, Share2 } from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { logClientError } from '@/shared/lib/client-logger';

import { pageLayout } from './layout-system';
import { PageHeader, PageHeaderStatus } from './PageHeader';

interface CalculatorPageShellProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  isCalculating: boolean;
  isDirty?: boolean;
  isError?: boolean;
  hasResults: boolean;
  onShare?: () => Promise<string | void> | string | void;
  extraHeaderActions?: ReactNode;
  onKeyDown?: (e: KeyboardEvent) => void;
  showImplicitShare?: boolean;
}

export function CalculatorPageShell({
  title,
  description,
  icon,
  children,
  isCalculating,
  isDirty = false,
  hasResults,
  onShare,
  extraHeaderActions,
  onKeyDown,
  showImplicitShare = true,
}: CalculatorPageShellProps) {
  const { t } = useAppI18n();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const nextUrl = onShare ? await onShare() : window.location.href;
      await navigator.clipboard.writeText(nextUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logClientError('Scenario share failed:', error);
    }
  };

  const hasShareAction = onShare ? hasResults : showImplicitShare && hasResults;

  const status = useMemo<PageHeaderStatus | null>(() => {
    if (isCalculating) {
      return {
        label: t('common.calculating'),
        state: 'loading',
        tone: 'neutral',
      };
    }

    if (hasResults && isDirty) {
      return {
        label: t('common.recalculation_hint'),
        state: 'idle',
        tone: 'warning',
      };
    }

    if (hasResults) {
      return {
        label: t('common.results_up_to_date'),
        state: 'complete',
        tone: 'success',
      };
    }

    return null;
  }, [hasResults, isCalculating, isDirty, t]);

  const headerAction =
    extraHeaderActions || hasShareAction ? (
      <>
        {extraHeaderActions}
        {hasShareAction ? (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-2 px-3 text-xs font-medium',
              copied ? 'border-[var(--finance-success)] text-[var(--finance-success)]' : '',
            )}
            onClick={handleShare}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? t('common.copied') : t('comparison.share_scenario')}
          </Button>
        ) : null}
      </>
    ) : null;

  return (
    <div className={pageLayout.pageFlow} onKeyDown={onKeyDown}>
      <PageHeader
        icon={icon}
        title={title}
        description={description}
        status={status}
        action={headerAction}
      />

      {children}
    </div>
  );
}
