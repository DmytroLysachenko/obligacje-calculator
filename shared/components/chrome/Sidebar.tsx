'use client';

import { Menu, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';

import { buildSidebarNavSections, SidebarNavigation } from './SidebarNavigation';
import { SidebarSettingsUtility } from './SidebarSettingsUtility';
import { SidebarUtilityGroup } from './SidebarUtilityGroup';
import { SidebarWorkspaceUtility } from './SidebarWorkspaceUtility';

interface SidebarContentProps {
  onItemClick?: () => void;
  dataFreshness?: CalculationDataFreshness;
}

function SidebarBrand() {
  const { t } = useAppI18n();

  return (
    <div className="border-b border-border px-4 py-5">
      <Link href="/" className="ui-interactive-surface flex items-center gap-3 rounded-md">
        <div className="inline-flex size-8 items-center justify-center rounded-md bg-foreground text-background">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold tracking-tight text-foreground" translate="no">
            {t('common.title')}
          </p>
          <p className="max-w-[11rem] text-xs leading-5 text-muted-foreground ui-pretty">
            {t('sidebar.brand_tagline')}
          </p>
        </div>
      </Link>
    </div>
  );
}

function SidebarFooter({ pathname }: { pathname: string }) {
  const { t } = useAppI18n();
  const hasMounted = useHasMounted();
  const { canManageWorkspace } = usePortfolioAccess();

  return (
    <footer className="space-y-5 border-t border-border bg-muted/20 px-3 py-4">
      {canManageWorkspace ? (
        <SidebarUtilityGroup title={t('sidebar.workspace_title')}>
          <SidebarWorkspaceUtility pathname={pathname} />
        </SidebarUtilityGroup>
      ) : null}
      <SidebarUtilityGroup title={t('common.settings')}>
        <SidebarSettingsUtility />
      </SidebarUtilityGroup>
      <div className="border-t border-border px-0.5 pt-3 text-xs leading-5 text-muted-foreground">
        {'\u00A9'} {hasMounted ? new Date().getFullYear() : '----'} {t('common.title')}
      </div>
    </footer>
  );
}

function SidebarContent({ onItemClick, dataFreshness }: SidebarContentProps) {
  const pathname = usePathname();
  const { t } = useAppI18n();

  const navSections = buildSidebarNavSections(t);

  return (
    <div className="flex h-full flex-col bg-secondary/70 text-foreground">
      <SidebarBrand />

      <nav
        aria-label={t('common.primary_navigation')}
        className="custom-scrollbar flex-1 space-y-8 overflow-y-auto overscroll-contain px-3 py-5"
      >
        <SidebarNavigation
          navSections={navSections}
          pathname={pathname}
          onItemClick={onItemClick}
        />
      </nav>

      <SidebarFooter pathname={pathname} />
    </div>
  );
}

function SidebarMobileContext({ pathname }: { pathname: string }) {
  const { t } = useAppI18n();
  const navSections = buildSidebarNavSections(t);
  const currentItem = navSections
    .flatMap((section) => section.items)
    .find((item) => item.href === pathname);

  return (
    <div className="min-w-0">
      <p className="ui-kicker truncate">{t('common.primary_navigation')}</p>
      <p className="truncate text-sm font-semibold tracking-tight text-foreground">
        {currentItem?.label ?? t('common.title')}
      </p>
    </div>
  );
}

export function Sidebar({ dataFreshness }: { dataFreshness?: CalculationDataFreshness }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useAppI18n();
  const pathname = usePathname();

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex min-h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="ui-interactive-surface flex shrink-0 items-center gap-2 rounded-md py-1 text-sm font-semibold tracking-tight text-foreground"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t('common.title')}</span>
          </Link>
          <SidebarMobileContext pathname={pathname} />
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('common.open_navigation')}
              className="size-11 border-border bg-card shadow-none"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">{t('common.open_navigation')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(22rem,100vw)] overscroll-contain border-none p-0"
          >
            <SheetTitle className="sr-only">{t('common.navigation_menu')}</SheetTitle>
            <SidebarContent onItemClick={() => setIsOpen(false)} dataFreshness={dataFreshness} />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] border-r border-border bg-secondary/70 lg:block">
        <SidebarContent dataFreshness={dataFreshness} />
      </aside>
    </>
  );
}
