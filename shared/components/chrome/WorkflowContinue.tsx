'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppI18n } from '@/i18n/client';

const STORAGE_KEY = 'bonds-calculator-last-route';

export function WorkflowContinue() {
  const pathname = usePathname();
  const { t } = useAppI18n();
  const [previousPath, setPreviousPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    const lastPath = window.sessionStorage.getItem(STORAGE_KEY);
    setPreviousPath(lastPath && lastPath !== pathname ? lastPath : null);
    window.sessionStorage.setItem(STORAGE_KEY, pathname);
  }, [pathname]);

  if (!previousPath) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={previousPath}
          aria-label={t('sidebar.continue_label')}
          className="ui-focus-ring inline-flex size-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </TooltipTrigger>
      <TooltipContent>{t('sidebar.continue_label')}</TooltipContent>
    </Tooltip>
  );
}
