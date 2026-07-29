'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useAppI18n } from '@/i18n/client';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';

import { MobileRouteHeader } from './MobileRouteHeader';
import { buildSidebarNavSections, SidebarNavigation } from './SidebarNavigation';
import { SidebarSettingsUtility } from './SidebarSettingsUtility';
import { SidebarUtilityGroup } from './SidebarUtilityGroup';
import { SidebarWorkspaceUtility } from './SidebarWorkspaceUtility';

interface SidebarContentProps {
  onItemClick?: () => void;
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

function SidebarFooter({
  pathname,
  canManageWorkspace,
}: {
  pathname: string;
  canManageWorkspace: boolean;
}) {
  const { t } = useAppI18n();
  const hasMounted = useHasMounted();

  return (
    <footer className="space-y-5 border-t border-border bg-muted/20 px-3 py-4">
      {canManageWorkspace ? (
        <SidebarUtilityGroup title={t('sidebar.workspace_title')}>
          <SidebarWorkspaceUtility pathname={pathname} canManageWorkspace={canManageWorkspace} />
        </SidebarUtilityGroup>
      ) : null}
      <details className="group border-t border-border pt-3">
        <summary className="ui-focus-ring flex min-h-11 items-center rounded-sm px-0.5 ui-kicker">
          {t('common.settings')}
        </summary>
        <div className="pt-2">
          <SidebarSettingsUtility />
        </div>
      </details>
      <div className="border-t border-border px-0.5 pt-3 text-xs leading-5 text-muted-foreground">
        {'\u00A9'} {hasMounted ? new Date().getFullYear() : '----'} {t('common.title')}
      </div>
    </footer>
  );
}

function SidebarContent({ onItemClick }: SidebarContentProps) {
  const pathname = usePathname();
  const { t } = useAppI18n();
  const { canManageWorkspace } = usePortfolioAccess();

  const navSections = buildSidebarNavSections(t, canManageWorkspace);

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

      <SidebarFooter pathname={pathname} canManageWorkspace={canManageWorkspace} />
    </div>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <MobileRouteHeader isOpen={isOpen} onOpenChange={setIsOpen}>
        <SidebarContent onItemClick={() => setIsOpen(false)} />
      </MobileRouteHeader>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] border-r border-border bg-secondary/70 lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
