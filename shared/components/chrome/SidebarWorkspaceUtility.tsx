'use client';

import { FolderKanban, LayoutList } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { useWorkspacePortfolios } from '@/shared/hooks/useWorkspacePortfolios';

import { SidebarUtilityPanel } from './SidebarUtilityGroup';

export function SidebarWorkspaceUtility({ pathname }: { pathname: string }) {
  const { t } = useAppI18n();
  const { canManageWorkspace } = usePortfolioAccess();
  const { portfolios, selectedPortfolioId, selectedPortfolio, setSelectedPortfolioId, refetch } =
    useWorkspacePortfolios({
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
      <div className="space-y-5">
        <div className="flex items-start gap-2.5">
          <div className="ui-icon-tile-sm">
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="ui-label">{t('sidebar.workspace_title')}</p>
            <p className="ui-field-description mt-0.5">{t('sidebar.workspace_desc')}</p>
          </div>
        </div>

        <div className="ui-status-note border-l-border">
          <div className="min-w-0">
            <p className="ui-kicker">{t('sidebar.portfolio_selector_label')}</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {selectedPortfolio
                ? t('sidebar.portfolio_selector_active', { name: selectedPortfolio.name })
                : t('sidebar.portfolio_selector_empty')}
            </p>
          </div>
        </div>

        <FormSelect
          value={selectedPortfolioId ?? ''}
          onValueChange={(value) => {
            setSelectedPortfolioId(value);
          }}
          placeholder={t('sidebar.portfolio_selector_empty')}
          triggerClassName="border-border bg-card"
          options={portfolios.map((portfolio) => ({
            value: portfolio.id,
            label: portfolio.name,
          }))}
        />

        <Button asChild variant="outline" className="h-10 w-full border-border bg-card text-sm">
          <Link href="/notebook" className="gap-2">
            <LayoutList className="h-4 w-4" aria-hidden="true" />
            {t('sidebar.workspace_manage')}
          </Link>
        </Button>
      </div>
    </SidebarUtilityPanel>
  );
}
