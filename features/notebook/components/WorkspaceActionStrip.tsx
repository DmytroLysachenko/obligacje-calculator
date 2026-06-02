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
    <section className="space-y-4 border-y border-border py-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
          {t('workspace.action_strip_title')}
        </p>
        <p className="ui-body">
          {canManageWorkspace
            ? t('workspace.action_strip_desc')
            : t('workspace.action_strip_guest_desc')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          onClick={onCreatePortfolio}
          className="gap-2 rounded-md"
          disabled={!canManageWorkspace}
        >
          <Plus className="h-4 w-4" />
          {canManageWorkspace
            ? t('notebook.new_portfolio')
            : t('workspace.sign_in_required_short')}
        </Button>
        <Button
          variant="outline"
          onClick={onCreateDemo}
          className="rounded-md border-border bg-card"
          disabled={!canManageWorkspace}
        >
          {t('notebook.load_demo')}
        </Button>
        <Button
          variant="ghost"
          onClick={onImport}
          className="gap-2 rounded-md"
          disabled={!canManageWorkspace}
        >
          <Upload className="h-4 w-4" />
          {t('notebook.import_json')}
        </Button>
        <Button variant="ghost" onClick={onRefresh} className="gap-2 rounded-md">
          <RefreshCcw className="h-4 w-4" />
          {t('common.refresh')}
        </Button>
      </div>
    </section>
  );
}
