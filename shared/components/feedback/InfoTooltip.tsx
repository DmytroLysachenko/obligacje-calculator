'use client';

import { Info } from 'lucide-react';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  content: React.ReactNode;
  label?: string;
  className?: string;
}

export function InfoTooltip({ content, label, className }: InfoTooltipProps) {
  const { t } = useAppI18n();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'ui-focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground',
            className,
          )}
          aria-label={label ?? t('common.more_information')}
        >
          <Info className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm items-start">
        <div className="text-xs leading-5">{content}</div>
      </TooltipContent>
    </Tooltip>
  );
}
