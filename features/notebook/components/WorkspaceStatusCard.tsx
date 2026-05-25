'use client';

import React from 'react';
import { BookOpen, FolderKanban, LockKeyhole } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppI18n } from '@/i18n/client';
import { UserPortfolio } from '@/db/schema';

interface WorkspaceStatusCardProps {
  isGuestWorkspace: boolean;
  canManageWorkspace: boolean;
  selectedPortfolio: UserPortfolio | null;
}

export function WorkspaceStatusCard({
  isGuestWorkspace,
  canManageWorkspace,
  selectedPortfolio,
}: WorkspaceStatusCardProps) {
  const { t } = useAppI18n();
  const workspaceStateIcon = canManageWorkspace ? FolderKanban : LockKeyhole;
  const WorkspaceStateIcon = workspaceStateIcon;

  return (
    <Card className="overflow-hidden rounded-[2.2rem] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(248,250,252,0.9))] shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] backdrop-blur">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-slate-700">
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

          <div className="min-w-[240px] rounded-[1.75rem] border border-white/80 bg-white/78 p-4 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                <WorkspaceStateIcon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
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
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
