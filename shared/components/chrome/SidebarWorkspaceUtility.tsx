'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { FolderKanban, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppI18n } from '@/i18n/client';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { useWorkspacePortfolios } from '@/shared/hooks/useWorkspacePortfolios';
import { SidebarUtilityPanel } from './SidebarUtilityGroup';

export function SidebarWorkspaceUtility({ pathname }: { pathname: string }) {
  const { t } = useAppI18n();
  const { canManageWorkspace } = usePortfolioAccess();
  const {
    portfolios,
    selectedPortfolioId,
    selectedPortfolio,
    setSelectedPortfolioId,
    refetch,
  } = useWorkspacePortfolios({
    enabled: canManageWorkspace,
  });

  useEffect(() => {
    void refetch();
  }, [pathname, refetch]);

  if (!canManageWorkspace || portfolios.length === 0) {
    return null;
  }

  return (
    <SidebarUtilityPanel>
      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="rounded-md bg-muted p-2 text-foreground">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {t('sidebar.workspace_title')}
            </p>
            <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
              {t('sidebar.workspace_desc')}
            </p>
          </div>
        </div>

        <div className="border-l-2 border-border pl-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('sidebar.portfolio_selector_label')}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {selectedPortfolio
              ? t('sidebar.portfolio_selector_active', { name: selectedPortfolio.name })
              : t('sidebar.portfolio_selector_empty')}
          </p>
        </div>

        <Select
          value={selectedPortfolioId ?? undefined}
          onValueChange={(value) => {
            setSelectedPortfolioId(value);
          }}
        >
          <SelectTrigger className="border-border bg-card">
            <SelectValue placeholder={t('sidebar.portfolio_selector_empty')} />
          </SelectTrigger>
          <SelectContent>
            {portfolios.map((portfolio) => (
              <SelectItem key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button asChild variant="outline" className="h-9 w-full rounded-md border-border bg-card text-sm">
          <Link href="/notebook" className="gap-2">
            <LayoutList className="h-4 w-4" />
            {t('sidebar.workspace_manage')}
          </Link>
        </Button>
      </div>
    </SidebarUtilityPanel>
  );
}
