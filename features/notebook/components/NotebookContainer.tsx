'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppI18n } from '@/i18n/client';
import { BookOpen, FolderOpen, Plus, RefreshCcw, Upload, CheckCircle2 } from 'lucide-react';
import { UserPortfolio } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { useDateFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useWorkspacePortfolios } from '@/shared/hooks/useWorkspacePortfolios';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ConfirmActionDialog } from '@/shared/components/feedback/ConfirmActionDialog';
import { Notice } from '@/shared/components/feedback/Notice';
import { unwrapApiData } from '@/shared/lib/api-response';
import { persistSelectedPortfolioId } from '@/shared/lib/workspace/notebook-state';
import { PortfolioDetails } from './PortfolioDetails';
import { PortfolioWorkspaceCard } from './PortfolioWorkspaceCard';
import { WorkspaceActionStrip } from './WorkspaceActionStrip';
import { WorkspaceStatusCard } from './WorkspaceStatusCard';
import { MetricStrip, MetricStripItem } from '@/shared/components/results/MetricStrip';
type NotebookStepItem = {
    id: string;
    title: string;
    description: string;
};
const EmptyPortfolioState = ({ onCreate, onCreateDemo, onImport, badgeLabel, title, description, createLabel, demoLabel, importLabel, capabilitiesTitle, capabilities, canManageWorkspace, }: {
    onCreate: () => void;
    onCreateDemo: () => void;
    onImport: () => void;
    badgeLabel: string;
    title: string;
    description: string;
    createLabel: string;
    demoLabel: string;
    importLabel: string;
    capabilitiesTitle: string;
    capabilities: NotebookStepItem[];
    canManageWorkspace: boolean;
}) => (<section className="space-y-6 border-t border-border py-8">
      <div className="space-y-3">
        <div className="surface-chip">
          <BookOpen className="h-3.5 w-3.5 text-foreground"/>
          {badgeLabel}
        </div>
        <h3 className="ui-section-title">
          {title}
        </h3>
        <p className="ui-body max-w-3xl">
          {description}
        </p>
      </div>

      {!canManageWorkspace ? (
        <Notice tone="locked" title={createLabel} compact>
          {description}
        </Notice>
      ) : null}

      <div className="space-y-4">
        <p className="ui-card-title">{capabilitiesTitle}</p>
        <div className="grid gap-x-6 gap-y-4 border-y border-border py-4 md:grid-cols-2">
          {capabilities.map((capability) => (
            <div key={capability.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0 md:border-t-0 md:pt-0">
              <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{capability.title}</p>
                <p className="ui-body text-muted-foreground">{capability.description}</p>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onCreate} className="gap-2 rounded-md" disabled={!canManageWorkspace}>
          <Plus className="h-4 w-4"/>
          {createLabel}
        </Button>
        <Button variant="outline" onClick={onCreateDemo} className="gap-2 rounded-md border-border" disabled={!canManageWorkspace}>
          {demoLabel}
        </Button>
        <Button variant="ghost" onClick={onImport} className="gap-2 rounded-md" disabled={!canManageWorkspace}>
          <Upload className="h-4 w-4"/>
          {importLabel}
        </Button>
      </div>
    </section>);
const NotebookLoadingState = () => (<div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-lg"/>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Skeleton className="h-56 w-full rounded-lg"/>
      <Skeleton className="h-56 w-full rounded-lg"/>
      <Skeleton className="h-56 w-full rounded-lg"/>
    </div>
  </div>);
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
    } | null) => {
        if (payload?.code === 'portfolio_storage_unavailable') {
            return t('notebook.storage_unavailable');
        }
        return payload?.error || t('notebook.create_error');
    }, [t]);
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
    const emptyStateSteps: NotebookStepItem[] = [
        {
            id: 'track',
            title: t('notebook.capabilities.track.title'),
            description: t('notebook.capabilities.track.desc'),
        },
        {
            id: 'maturities',
            title: t('notebook.capabilities.maturities.title'),
            description: t('notebook.capabilities.maturities.desc'),
        },
        {
            id: 'export',
            title: t('notebook.capabilities.export.title'),
            description: t('notebook.capabilities.export.desc'),
        },
        {
            id: 'projection',
            title: t('notebook.capabilities.projection.title'),
            description: t('notebook.capabilities.projection.desc'),
        },
    ];
    const handleCreateDefault = async () => {
        setIsMutating(true);
        try {
            const response = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: t('notebook.my_first_portfolio'),
                    description: t('notebook.default_description'),
                }),
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setError(resolvePortfolioError(payload));
                return;
            }
            const created = unwrapApiData<UserPortfolio>(await response.json().catch(() => null));
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
            setError(t('notebook.create_error'));
        }
        finally {
            setIsMutating(false);
        }
    };
    const handleCreateDemo = async () => {
        setIsMutating(true);
        try {
            const response = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: t('notebook.demo_name'),
                    description: t('notebook.demo_description'),
                }),
            });
            if (!response.ok) {
                throw new Error(t('notebook.create_error'));
            }
            const portfolioResponse = await response.json();
            const createdPortfolio = unwrapApiData<UserPortfolio>(portfolioResponse);
            const portfolioId = createdPortfolio?.id;
            const demoLots = [
                { bondType: 'EDO', amount: 50, purchaseDate: '2023-01-01' },
                { bondType: 'COI', amount: 100, purchaseDate: '2023-06-15' },
                { bondType: 'TOS', amount: 200, purchaseDate: '2024-01-10' },
            ];
            for (const lot of demoLots) {
                await fetch('/api/portfolio/lots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ portfolioId, ...lot }),
                });
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
            setError(t('notebook.create_error'));
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
            const response = await fetch('/api/portfolio/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            });
            if (!response.ok) {
                throw new Error(t('notebook.create_error'));
            }
            setError(null);
            const importPayload = unwrapApiData<{
                portfolio?: UserPortfolio;
                importedLots?: number;
            }>(await response.clone().json().catch(() => null));
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
            const response = await fetch(`/api/portfolio?id=${portfolio.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setError(resolvePortfolioError(payload));
                return;
            }
            removePortfolioFromState(portfolio.id);
            setDetailPortfolioId((current) => current === portfolio.id ? null : current);
            setError(null);
            setStatusMessage(t('notebook.delete_success'));
        }
        catch (caughtError) {
            console.error(caughtError);
            setError(t('notebook.delete_failed'));
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
    const publicCount = portfolios.filter((portfolio) => portfolio.isPublic).length;
    const privateCount = portfolios.length - publicCount;
    const notebookStats: MetricStripItem[] = [
        {
            label: t('notebook.portfolios_label'),
            value: String(portfolios.length),
            description: t('notebook.portfolios_label_desc'),
        },
        {
            label: t('notebook.public_links_label'),
            value: String(publicCount),
            description: t('notebook.public_links_label_desc'),
        },
        {
            label: t('notebook.private_drafts_label'),
            value: String(privateCount),
            description: t('notebook.private_drafts_label_desc'),
        },
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





