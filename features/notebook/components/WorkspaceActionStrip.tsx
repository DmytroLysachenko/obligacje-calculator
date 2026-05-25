'use client';

import React from 'react';
import { Plus, RefreshCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppI18n } from '@/i18n/client';

interface WorkspaceActionStripProps {
  canManageWorkspace: boolean;
  onImport: () => void;
  onCreateDemo: () => void;
  onRefresh: () => void;
  onCreatePortfolio: () => void;
}

export function WorkspaceActionStrip({
  canManageWorkspace,
  onImport,
  onCreateDemo,
  onRefresh,
  onCreatePortfolio,
}: WorkspaceActionStripProps) {
  const { t } = useAppI18n();

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/84 p-5 shadow-[0_18px_44px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.08em] text-slate-500">
            {t('workspace.action_strip_title')}
          </p>
          <p className="text-sm leading-7 text-slate-600">
            {canManageWorkspace
              ? t('workspace.action_strip_desc')
              : t('workspace.action_strip_guest_desc')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onImport}
            className="gap-2 rounded-2xl border-slate-200 bg-white/80"
            disabled={!canManageWorkspace}
          >
            <Upload className="h-4 w-4" />
            {t('notebook.import_json')}
          </Button>
          <Button
            variant="outline"
            onClick={onCreateDemo}
            className="rounded-2xl border-slate-200 bg-white/80"
            disabled={!canManageWorkspace}
          >
            {t('notebook.load_demo')}
          </Button>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="gap-2 rounded-2xl border-slate-200 bg-white/80"
          >
            <RefreshCcw className="h-4 w-4" />
            {t('common.refresh')}
          </Button>
          <Button
            onClick={onCreatePortfolio}
            className="gap-2 rounded-2xl"
            disabled={!canManageWorkspace}
          >
            <Plus className="h-4 w-4" />
            {canManageWorkspace
              ? t('notebook.new_portfolio')
              : t('workspace.sign_in_required_short')}
          </Button>
        </div>
      </div>
    </div>
  );
}
