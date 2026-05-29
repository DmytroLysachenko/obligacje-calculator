'use client';

import React from 'react';
import { BookOpen, FolderKanban, LockKeyhole } from 'lucide-react';
import { useAppI18n } from '@/i18n/client';
import { UserPortfolio } from '@/db/schema';

interface WorkspaceStatusCardProps {
  isGuestWorkspace: boolean;
  canManageWorkspace: boolean;
  selectedPortfolio: UserPortfolio | null;
  portfolios: UserPortfolio[];
  onActivePortfolioChange: (portfolioId: string | null) => void;
}

export function WorkspaceStatusCard({
  isGuestWorkspace,
  canManageWorkspace,
  selectedPortfolio,
  portfolios,
  onActivePortfolioChange,
}: WorkspaceStatusCardProps) {
  const { t } = useAppI18n();
  const workspaceStateIcon = canManageWorkspace ? FolderKanban : LockKeyhole;
  const WorkspaceStateIcon = workspaceStateIcon;

  return (
    <section className="space-y-5 rounded-[1.9rem] border border-slate-200 bg-white px-5 py-5 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-slate-700">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            {isGuestWorkspace
              ? t('workspace.guest_preview_badge')
              : t('workspace.active_workspace_badge')}
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {isGuestWorkspace
              ? t('workspace.guest_preview_description')
              : t('workspace.active_workspace_description')}
          </p>
        </div>

        <div className="min-w-[280px] rounded-[1.5rem] border border-slate-200 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-900">
              <WorkspaceStateIcon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-xs font-semibold tracking-[0.08em] text-slate-500">
                {t('workspace.active_selection_title')}
              </p>
              <p className="text-lg font-black tracking-tight text-slate-950">
                {selectedPortfolio?.name ?? t('workspace.no_active_portfolio')}
              </p>
              <p className="text-sm leading-6 text-slate-600">
                {canManageWorkspace
                  ? selectedPortfolio
                    ? t('workspace.active_selection_desc')
                    : t('workspace.create_first_portfolio_desc')
                  : t('workspace.preview_only_desc')}
              </p>

              {canManageWorkspace && portfolios.length > 0 ? (
                <label className="block space-y-2 border-t border-dashed border-slate-200 pt-3">
                  <span className="text-xs font-semibold tracking-[0.08em] text-slate-500">
                    {t('common.portfolio_selector_label')}
                  </span>
                  <select
                    value={selectedPortfolio?.id ?? ''}
                    onChange={(event) =>
                      onActivePortfolioChange(event.target.value || null)
                    }
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{t('common.portfolio_selector_empty')}</option>
                    {portfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
