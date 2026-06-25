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
import { SidebarSyncSummary } from './SidebarSyncSummary';
import { SidebarUtilityGroup } from './SidebarUtilityGroup';
import { SidebarWorkspaceUtility } from './SidebarWorkspaceUtility';

interface SidebarContentProps {
  onItemClick?: () => void;
  dataFreshness?: CalculationDataFreshness;
}

function SidebarBrand() {
  const { t } = useAppI18n();

  return (
    <div className="border-b border-border px-4 py-4">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="rounded-md bg-foreground p-1.5 text-background">
          <TrendingUp className="h-3 w-3" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {t('common.title')}
          </p>
          <p className="max-w-[11rem] text-xs leading-5 text-muted-foreground">
            {t('sidebar.brand_tagline')}
          </p>
        </div>
      </Link>
    </div>
  );
}

function SidebarFooter({
  dataFreshness,
  pathname,
}: {
  dataFreshness?: CalculationDataFreshness;
  pathname: string;
}) {
  const { t } = useAppI18n();
  const hasMounted = useHasMounted();
  const { canManageWorkspace } = usePortfolioAccess();

  return (
    <div className="space-y-4 border-t border-border bg-muted/20 px-3 py-4">
      {canManageWorkspace ? (
        <SidebarUtilityGroup title={t('sidebar.workspace_title')}>
          <SidebarWorkspaceUtility pathname={pathname} />
        </SidebarUtilityGroup>
      ) : null}
      <SidebarUtilityGroup title={t('common.settings')}>
        <SidebarSettingsUtility />
        <SidebarSyncSummary dataFreshness={dataFreshness} />
      </SidebarUtilityGroup>
      <div className="border-t border-border px-0.5 pt-3 text-xs leading-5 text-muted-foreground">
        {'\u00A9'} {hasMounted ? new Date().getFullYear() : '----'} {t('common.title')}
      </div>
    </div>
  );
}

function SidebarContent({ onItemClick, dataFreshness }: SidebarContentProps) {
  const pathname = usePathname();
  const { t } = useAppI18n();

  const navSections = buildSidebarNavSections(t);

  return (
    <div className="flex h-full flex-col border-r border-border bg-secondary/70 text-foreground">
      <SidebarBrand />

      <nav
        aria-label={t('common.primary_navigation')}
        className="custom-scrollbar flex-1 space-y-7 overflow-y-auto px-3 py-5"
      >
        <SidebarNavigation
          navSections={navSections}
          pathname={pathname}
          onItemClick={onItemClick}
        />
      </nav>

      <SidebarFooter dataFreshness={dataFreshness} pathname={pathname} />
    </div>
  );
}

export function Sidebar({ dataFreshness }: { dataFreshness?: CalculationDataFreshness }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useAppI18n();

  return (
    <>
      <div className="fixed left-3 top-3 z-50 lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('common.open_navigation')}
              className="border border-border bg-card shadow-none"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t('common.open_navigation')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(22rem,100vw)] border-none p-0">
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
