'use client';

import { ArrowRight, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

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
    <Link
      href={previousPath}
      className="ui-interactive-surface flex items-center gap-2 rounded-md border border-border bg-background px-3 py-3 text-left"
    >
      <History className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block ui-kicker">{t('sidebar.continue_label')}</span>
        <span className="block truncate text-xs font-semibold text-foreground">{previousPath}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
