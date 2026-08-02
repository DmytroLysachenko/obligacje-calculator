'use client';

import { Menu, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAppI18n } from '@/i18n/client';
import { getFeaturesForNavigation } from '@/shared/lib/feature-catalog';
import type { FeatureStatus } from '@/shared/types/feature-status';

const statusClassNames: Record<FeatureStatus, string> = {
  trusted: 'bg-success/10 text-success',
  reference: 'bg-primary/10 text-primary',
  conditional: 'bg-warning/10 text-warning-foreground',
  experimental: 'bg-muted text-muted-foreground',
  limited: 'bg-muted text-muted-foreground',
};

function getStatusLabel(status: FeatureStatus, t: (key: string) => string) {
  const labels: Record<FeatureStatus, string> = {
    trusted: t('shared.feature_status.labels.trusted'),
    reference: t('shared.feature_status.labels.reference'),
    conditional: t('shared.feature_status.labels.conditional'),
    experimental: t('shared.feature_status.labels.experimental'),
    limited: t('shared.feature_status.labels.limited'),
  };
  return labels[status];
}

interface MobileRouteHeaderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function MobileRouteHeader({ isOpen, onOpenChange, children }: MobileRouteHeaderProps) {
  const pathname = usePathname();
  const { t } = useAppI18n();
  const currentFeature = useMemo(
    () =>
      [...getFeaturesForNavigation('core'), ...getFeaturesForNavigation('conditional')].find(
        (feature) => feature.route === pathname,
      ),
    [pathname],
  );
  const title = currentFeature ? t(currentFeature.titleKey) : t('common.title');
  const statusLabel = currentFeature ? getStatusLabel(currentFeature.status, t) : null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm lg:hidden">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label={t('common.title')}
            className="ui-interactive-surface inline-flex size-11 shrink-0 items-center justify-center rounded-md text-foreground"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <p className="ui-kicker truncate">{t('common.primary_navigation')}</p>
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {title}
              </p>
              {statusLabel && currentFeature ? (
                <span
                  className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${statusClassNames[currentFeature.status]}`}
                >
                  {statusLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('common.open_navigation')}
              aria-expanded={isOpen}
              className="size-11 shrink-0 border-border bg-card shadow-none"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(22rem,100vw)] overscroll-contain border-none p-0"
          >
            <SheetTitle className="sr-only">{t('common.navigation_menu')}</SheetTitle>
            {children}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
