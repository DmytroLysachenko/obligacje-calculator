'use client';
import { BookOpen, FolderOpen, RefreshCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { UserPortfolio } from '@/db/schema';
import { useNotebookWorkspaceActions } from '@/features/notebook/hooks/useNotebookWorkspaceActions';
import {
  buildNotebookCapabilities,
  buildNotebookStats,
  getNotebookPortfolioCounts,
  type NotebookStepItem,
} from '@/features/notebook/lib/notebook-workspace-model';
import { useAppI18n } from '@/i18n/client';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ConfirmActionDialog } from '@/shared/components/feedback/ConfirmActionDialog';
import { Notice } from '@/shared/components/feedback/Notice';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { MetricStrip, MetricStripItem } from '@/shared/components/results/MetricStrip';
import { useDateFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { useWorkspacePortfolios } from '@/shared/hooks/useWorkspacePortfolios';
import { persistSelectedPortfolioId } from '@/shared/lib/workspace/notebook-state';

import { EmptyPortfolioState, NotebookLoadingState } from './NotebookStates';
import { PortfolioDetails } from './PortfolioDetails';
import { PortfolioWorkspaceCard } from './PortfolioWorkspaceCard';
import { WorkspaceActionStrip } from './WorkspaceActionStrip';
import { WorkspaceStatusCard } from './WorkspaceStatusCard';
export const NotebookContainer: React.FC = () => {
  const { t, locale: language } = useAppI18n();
  const [portfolioPendingDelete, setPortfolioPendingDelete] = useState<UserPortfolio | null>(null);
  const [detailPortfolioId, setDetailPortfolioId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const { canManageWorkspace, isGuestWorkspace } = usePortfolioAccess();
  const dateFormatter = useDateFormatter(language);
  const {
    portfolios,
    selectedPortfolio,
    isLoading,
    requestError,
    refetch: fetchPortfolios,
    setSelectedPortfolioId,
    upsertPortfolio: mergePortfolioIntoState,
    removePortfolio: removePortfolioFromState,
  } = useWorkspacePortfolios();
  const {
    error,
    setError,
    statusMessage,
    setStatusMessage,
    isMutating,
    resolvePortfolioError,
    handleCreateDefault,
    handleCreateDemo,
    handleImportFile,
    handleDeletePortfolio,
  } = useNotebookWorkspaceActions({
    labels: {
      myFirstPortfolio: t('notebook.my_first_portfolio'),
      defaultDescription: t('notebook.default_description'),
      demoName: t('notebook.demo_name'),
      demoDescription: t('notebook.demo_description'),
      createdSuccess: t('notebook.created_success'),
      demoLoadedSuccess: t('notebook.demo_loaded_success'),
      importCompleted: (count) => t('notebook.import_completed_added_lots', { count }),
      importFailed: t('notebook.import_failed'),
      deleteSuccess: t('notebook.delete_success'),
      deleteFailed: t('notebook.delete_failed'),
      storageUnavailable: t('notebook.storage_unavailable'),
      createError: t('notebook.create_error'),
    },
    fetchPortfolios,
    mergePortfolioIntoState,
    removePortfolioFromState,
    setSelectedPortfolioId,
    clearDetailPortfolio: (portfolioId) => {
      setDetailPortfolioId((current) => (current === portfolioId ? null : current));
    },
  });
  useEffect(() => {
    if (requestError) {
      setError(
        resolvePortfolioError(
          requestError as {
            error?: string;
            code?: string;
          },
        ),
      );
      return;
    }
    setError(null);
  }, [requestError, resolvePortfolioError, setError]);
  const emptyStateSteps: NotebookStepItem[] = buildNotebookCapabilities(t);
  const handleImportClick = () => {
    importRef.current?.click();
  };
  if (detailPortfolioId && canManageWorkspace) {
    const portfolio = portfolios.find((item) => item.id === detailPortfolioId) ?? null;
    return portfolio ? (
      <PortfolioDetails
        portfolio={portfolio}
        onDelete={handleDeletePortfolio}
        onPortfolioUpdate={mergePortfolioIntoState}
        onBack={() => {
          void fetchPortfolios();
          setDetailPortfolioId(null);
        }}
      />
    ) : (
      <NotebookLoadingState />
    );
  }
  const notebookIntro = t('notebook.workspace_intro');
  const portfolioCounts = getNotebookPortfolioCounts(portfolios);
  const notebookStats: MetricStripItem[] = [
    ...buildNotebookStats({
      counts: portfolioCounts,
      labels: {
        portfolios: t('notebook.portfolios_label'),
        portfoliosDescription: t('notebook.portfolios_label_desc'),
        publicLinks: t('notebook.public_links_label'),
        publicLinksDescription: t('notebook.public_links_label_desc'),
        privateDrafts: t('notebook.private_drafts_label'),
        privateDraftsDescription: t('notebook.private_drafts_label_desc'),
      },
    }),
  ];
  return (
    <CalculatorPageShell
      title={t('notebook.title')}
      description={t('notebook.subtitle')}
      icon={<BookOpen className="h-8 w-8" />}
      isCalculating={isLoading || isMutating}
      hasResults={portfolios.length > 0}
    >
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {error ? (
        <Notice tone="warning" title={error}>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchPortfolios}>
              <RefreshCcw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        </Notice>
      ) : null}

      <SectionBlock title={t('notebook.workspace_scope_title')} description={notebookIntro}>
        <div className="space-y-4">
          {isGuestWorkspace ? (
            <Notice tone="locked" title={t('workspace.sign_in_required_short')}>
              {t('workspace.locked_notebook_notice')}
            </Notice>
          ) : null}

          <WorkspaceStatusCard
            isGuestWorkspace={isGuestWorkspace}
            canManageWorkspace={canManageWorkspace}
            selectedPortfolio={selectedPortfolio}
            portfolios={portfolios}
            onActivePortfolioChange={setSelectedPortfolioId}
          />

          <WorkspaceActionStrip
            canManageWorkspace={canManageWorkspace}
            onImport={handleImportClick}
            onCreateDemo={handleCreateDemo}
            onRefresh={fetchPortfolios}
            onCreatePortfolio={handleCreateDefault}
          />

          <MetricStrip items={notebookStats} columns="grid-cols-1 md:grid-cols-3" />
        </div>
      </SectionBlock>

      {isLoading ? (
        <NotebookLoadingState />
      ) : portfolios.length === 0 ? (
        <EmptyPortfolioState
          onCreate={canManageWorkspace ? handleCreateDefault : () => {}}
          onCreateDemo={canManageWorkspace ? handleCreateDemo : () => {}}
          onImport={canManageWorkspace ? handleImportClick : () => {}}
          badgeLabel={t('notebook.empty_badge')}
          title={t('notebook.empty_title')}
          description={
            canManageWorkspace ? t('notebook.empty_desc') : t('workspace.empty_guest_description')
          }
          createLabel={
            canManageWorkspace ? t('notebook.create_first') : t('workspace.sign_in_required_short')
          }
          demoLabel={t('notebook.load_demo')}
          importLabel={t('notebook.import_json')}
          capabilitiesTitle={t('notebook.capabilities_title')}
          capabilities={emptyStateSteps}
          canManageWorkspace={canManageWorkspace}
        />
      ) : (
        <div className="space-y-8">
          <SectionBlock
            title={t('notebook.stored_portfolios')}
            description={t('notebook.stored_portfolios_desc')}
          >
            <div className="border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
              {t('notebook.stored_portfolios_note')}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {portfolios.map((portfolio) => (
                <PortfolioWorkspaceCard
                  key={portfolio.id}
                  portfolio={{
                    id: portfolio.id,
                    name: portfolio.name,
                    description: portfolio.description,
                    isPublic: portfolio.isPublic,
                    createdAtLabelValue: dateFormatter.format(new Date(portfolio.createdAt!)),
                  }}
                  createdAtLabel={t('common.created')}
                  usageLabel={t('notebook.usage_label')}
                  usageDescription={t('notebook.usage_desc')}
                  statusLabel={
                    portfolio.isPublic ? t('notebook.status_public') : t('notebook.status_private')
                  }
                  fallbackDescription={t('notebook.portfolio_details')}
                  actionLabel={
                    canManageWorkspace
                      ? t('notebook.open_portfolio')
                      : t('workspace.sign_in_required_short')
                  }
                  canManageWorkspace={canManageWorkspace}
                  onOpen={() => {
                    setSelectedPortfolioId(portfolio.id);
                    persistSelectedPortfolioId(portfolio.id);
                    setDetailPortfolioId(portfolio.id);
                  }}
                  onRequestDelete={() => {
                    setPortfolioPendingDelete(portfolio);
                  }}
                />
              ))}
            </div>
          </SectionBlock>

          <section className="surface-shell flex items-start gap-3 p-5">
            <FolderOpen className="mt-0.5 h-5 w-5 text-foreground" />
            <div className="space-y-2">
              <p className="ui-card-title">{t('notebook.scope_title')}</p>
              <p className="ui-body">{t('notebook.scope_desc')}</p>
            </div>
          </section>
        </div>
      )}

      <ConfirmActionDialog
        open={!!portfolioPendingDelete}
        title={t('notebook.delete_portfolio')}
        description={
          portfolioPendingDelete
            ? t('notebook.confirm_delete_portfolio_short', {
                name: portfolioPendingDelete.name,
              })
            : ''
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setPortfolioPendingDelete(null)}
        onConfirm={async () => {
          const portfolio = portfolioPendingDelete;
          setPortfolioPendingDelete(null);
          if (portfolio) {
            await handleDeletePortfolio(portfolio);
          }
        }}
      />

      <AppToast message={statusMessage} onDismiss={() => setStatusMessage(null)} />
    </CalculatorPageShell>
  );
};
