'use client';
import { BookOpen } from 'lucide-react';
import React, { useEffect } from 'react';

import { useNotebookContainerWorkspace } from '@/features/notebook/hooks/useNotebookContainerWorkspace';
import { useNotebookWorkspaceActions } from '@/features/notebook/hooks/useNotebookWorkspaceActions';
import {
  buildNotebookFeedbackLabels,
  buildNotebookPortfolioListLabels,
  buildNotebookWorkspaceActionLabels,
} from '@/features/notebook/lib/notebook-container-labels';
import { buildNotebookWorkspaceViewModel } from '@/features/notebook/lib/notebook-workspace-model';
import { useAppI18n } from '@/i18n/client';
import { Notice } from '@/shared/components/feedback/Notice';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { MetricStrip } from '@/shared/components/results/MetricStrip';
import { useDateFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { useWorkspacePortfolios } from '@/shared/hooks/useWorkspacePortfolios';

import { NotebookPortfolioListSection, NotebookScopeNote } from './NotebookContainerPanels';
import { EmptyPortfolioState, NotebookLoadingState } from './NotebookStates';
import { NotebookErrorNotice, NotebookWorkspaceFeedback } from './NotebookWorkspaceFeedback';
import { PortfolioDetails } from './PortfolioDetails';
import { WorkspaceActionStrip } from './WorkspaceActionStrip';
import { WorkspaceStatusCard } from './WorkspaceStatusCard';
export const NotebookContainer: React.FC = () => {
  const { t, locale: language } = useAppI18n();
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
    portfolioPendingDelete,
    setPortfolioPendingDelete,
    detailPortfolioId,
    importRef,
    clearDetailPortfolio,
    handleImportClick,
    handleOpenPortfolio,
    handleClosePortfolioDetails,
  } = useNotebookContainerWorkspace({
    fetchPortfolios,
    setSelectedPortfolioId,
  });
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
    labels: buildNotebookWorkspaceActionLabels(t),
    fetchPortfolios,
    mergePortfolioIntoState,
    removePortfolioFromState,
    setSelectedPortfolioId,
    clearDetailPortfolio,
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
  const { detailPortfolio, emptyStateSteps, notebookIntro, notebookStats } =
    buildNotebookWorkspaceViewModel({
      portfolios,
      detailPortfolioId,
      t,
    });

  if (detailPortfolioId && canManageWorkspace) {
    return detailPortfolio ? (
      <PortfolioDetails
        portfolio={detailPortfolio}
        onDelete={handleDeletePortfolio}
        onPortfolioUpdate={mergePortfolioIntoState}
        onBack={handleClosePortfolioDetails}
      />
    ) : (
      <NotebookLoadingState />
    );
  }

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

      <NotebookErrorNotice error={error} retryLabel={t('common.retry')} onRetry={fetchPortfolios} />

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
          <NotebookPortfolioListSection
            portfolios={portfolios}
            canManageWorkspace={canManageWorkspace}
            formatDate={(date) => dateFormatter.format(date)}
            labels={buildNotebookPortfolioListLabels(t)}
            onOpenPortfolio={handleOpenPortfolio}
            onRequestDelete={setPortfolioPendingDelete}
          />

          <NotebookScopeNote
            title={t('notebook.scope_title')}
            description={t('notebook.scope_desc')}
          />
        </div>
      )}

      <NotebookWorkspaceFeedback
        portfolioPendingDelete={portfolioPendingDelete}
        statusMessage={statusMessage}
        labels={buildNotebookFeedbackLabels(t)}
        onCancelDelete={() => setPortfolioPendingDelete(null)}
        onConfirmDelete={async (portfolio) => {
          setPortfolioPendingDelete(null);
          await handleDeletePortfolio(portfolio);
        }}
        onDismissToast={() => setStatusMessage(null)}
      />
    </CalculatorPageShell>
  );
};
