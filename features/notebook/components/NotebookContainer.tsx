'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppI18n } from '@/i18n/client';
import { BookOpen, FolderOpen, RefreshCcw } from 'lucide-react';
import { UserPortfolio } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { useDateFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useWorkspacePortfolios } from '@/shared/hooks/useWorkspacePortfolios';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ConfirmActionDialog } from '@/shared/components/feedback/ConfirmActionDialog';
import { Notice } from '@/shared/components/feedback/Notice';
import { ApiClientError } from '@/shared/lib/api-client';
import { portfolioClient } from '@/shared/lib/portfolio-client';
import { persistSelectedPortfolioId } from '@/shared/lib/workspace/notebook-state';
import { PortfolioDetails } from './PortfolioDetails';
import { PortfolioWorkspaceCard } from './PortfolioWorkspaceCard';
import { WorkspaceActionStrip } from './WorkspaceActionStrip';
import { WorkspaceStatusCard } from './WorkspaceStatusCard';
import { EmptyPortfolioState, NotebookLoadingState } from './NotebookStates';
import { MetricStrip, MetricStripItem } from '@/shared/components/results/MetricStrip';
import {
    buildNotebookCapabilities,
    buildNotebookStats,
    getNotebookPortfolioCounts,
    NOTEBOOK_DEMO_LOTS,
    resolveNotebookPortfolioError,
    type NotebookStepItem,
} from '@/features/notebook/lib/notebook-workspace-model';
export const NotebookContainer: React.FC = () => {
    const { t, locale: language } = useAppI18n();
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [portfolioPendingDelete, setPortfolioPendingDelete] = useState<UserPortfolio | null>(null);
    const [isMutating, setIsMutating] = useState(false);
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
    const resolvePortfolioError = useCallback((payload?: {
        error?: string;
        code?: string;
    } | null) => resolveNotebookPortfolioError(payload, {
        storageUnavailable: t('notebook.storage_unavailable'),
        createError: t('notebook.create_error'),
    }), [t]);
    const resolveCaughtPortfolioError = useCallback((caughtError: unknown) => {
        if (caughtError instanceof ApiClientError) {
            return resolvePortfolioError({
                error: caughtError.message,
                code: caughtError.code,
            });
        }
        return t('notebook.create_error');
    }, [resolvePortfolioError, t]);
    useEffect(() => {
        if (requestError) {
            setError(resolvePortfolioError(requestError as {
                error?: string;
                code?: string;
            }));
            return;
        }
        setError(null);
    }, [requestError, resolvePortfolioError]);
    const emptyStateSteps: NotebookStepItem[] = buildNotebookCapabilities(t);
    const handleCreateDefault = async () => {
        setIsMutating(true);
        try {
            const created = await portfolioClient.createPortfolio({
                name: t('notebook.my_first_portfolio'),
                description: t('notebook.default_description'),
            });
            setError(null);
            setStatusMessage(t('notebook.created_success'));
            if (created?.id) {
                mergePortfolioIntoState(created);
                setSelectedPortfolioId(created.id);
            }
            else {
                await fetchPortfolios();
            }
        }
        catch (caughtError) {
            console.error(caughtError);
            setError(resolveCaughtPortfolioError(caughtError));
        }
        finally {
            setIsMutating(false);
        }
    };
    const handleCreateDemo = async () => {
        setIsMutating(true);
        try {
            const createdPortfolio = await portfolioClient.createPortfolio({
                name: t('notebook.demo_name'),
                description: t('notebook.demo_description'),
            });
            const portfolioId = createdPortfolio?.id;
            if (!portfolioId) {
                await fetchPortfolios();
                return;
            }
            for (const lot of NOTEBOOK_DEMO_LOTS) {
                await portfolioClient.createLot({ portfolioId, ...lot });
            }
            if (createdPortfolio?.id) {
                mergePortfolioIntoState(createdPortfolio);
                setSelectedPortfolioId(createdPortfolio.id);
                setStatusMessage(t('notebook.demo_loaded_success'));
            }
            else {
                await fetchPortfolios();
            }
        }
        catch (caughtError) {
            console.error(caughtError);
            setError(resolveCaughtPortfolioError(caughtError));
        }
        finally {
            setIsMutating(false);
        }
    };
    const handleImportClick = () => {
        importRef.current?.click();
    };
    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        try {
            setIsMutating(true);
            const text = await file.text();
            const parsed = JSON.parse(text);
            const importPayload = await portfolioClient.importPortfolio(parsed);
            setError(null);
            if (importPayload?.portfolio?.id) {
                mergePortfolioIntoState(importPayload.portfolio);
                setSelectedPortfolioId(importPayload.portfolio.id);
                setStatusMessage(t('notebook.import_completed_added_lots', {
                    count: String(importPayload.importedLots ?? 0),
                }));
            }
            else {
                await fetchPortfolios();
            }
        }
        catch (caughtError) {
            console.error(caughtError);
            setError(t('notebook.import_failed'));
        }
        finally {
            setIsMutating(false);
            event.target.value = '';
        }
    };
    const handleDeletePortfolio = async (portfolio: UserPortfolio) => {
        setIsMutating(true);
        try {
            await portfolioClient.deletePortfolio(portfolio.id);
            removePortfolioFromState(portfolio.id);
            setDetailPortfolioId((current) => current === portfolio.id ? null : current);
            setError(null);
            setStatusMessage(t('notebook.delete_success'));
        }
        catch (caughtError) {
            console.error(caughtError);
            setError(caughtError instanceof ApiClientError ? resolveCaughtPortfolioError(caughtError) : t('notebook.delete_failed'));
        }
        finally {
            setIsMutating(false);
        }
    };
    if (detailPortfolioId && canManageWorkspace) {
        const portfolio = portfolios.find((item) => item.id === detailPortfolioId) ?? null;
        return portfolio ? (<PortfolioDetails portfolio={portfolio} onDelete={handleDeletePortfolio} onPortfolioUpdate={mergePortfolioIntoState} onBack={() => {
                void fetchPortfolios();
                setDetailPortfolioId(null);
            }}/>) : (<NotebookLoadingState />);
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
    return (<CalculatorPageShell title={t('notebook.title')} description={t('notebook.subtitle')} icon={<BookOpen className="h-8 w-8"/>} isCalculating={isLoading || isMutating} hasResults={portfolios.length > 0}>
      <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile}/>

      {error ? (<Notice tone="warning" title={error}>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchPortfolios}>
              <RefreshCcw className="h-4 w-4"/>
              {t('common.retry')}
            </Button>
          </div>
        </Notice>) : null}

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
          description={canManageWorkspace
            ? t('notebook.empty_desc')
            : t('workspace.empty_guest_description')}
          createLabel={canManageWorkspace
            ? t('notebook.create_first')
            : t('workspace.sign_in_required_short')}
          demoLabel={t('notebook.load_demo')}
          importLabel={t('notebook.import_json')}
          capabilitiesTitle={t('notebook.capabilities_title')}
          capabilities={emptyStateSteps}
          canManageWorkspace={canManageWorkspace}
        />
      ) : (
        <div className="space-y-8">
          <SectionBlock title={t('notebook.stored_portfolios')} description={t('notebook.stored_portfolios_desc')}>
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
                  statusLabel={portfolio.isPublic
                    ? t('notebook.status_public')
                    : t('notebook.status_private')}
                  fallbackDescription={t('notebook.portfolio_details')}
                  actionLabel={canManageWorkspace ? t('notebook.open_portfolio') : t('workspace.sign_in_required_short')}
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
            <FolderOpen className="mt-0.5 h-5 w-5 text-foreground"/>
            <div className="space-y-2">
              <p className="ui-card-title">
                {t('notebook.scope_title')}
              </p>
              <p className="ui-body">
                {t('notebook.scope_desc')}
              </p>
            </div>
          </section>
        </div>
      )}

      <ConfirmActionDialog
        open={!!portfolioPendingDelete}
        title={t('notebook.delete_portfolio')}
        description={portfolioPendingDelete
          ? t('notebook.confirm_delete_portfolio_short', {
              name: portfolioPendingDelete.name,
            })
          : ''}
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
    </CalculatorPageShell>);
};





