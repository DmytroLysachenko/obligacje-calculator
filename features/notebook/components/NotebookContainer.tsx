'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppI18n } from '@/i18n/client';
import { AlertCircle, BookOpen, CheckCircle2, FolderOpen, Plus, RefreshCcw, Upload, } from 'lucide-react';
import { UserPortfolio } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioAccess } from '@/shared/hooks/usePortfolioAccess';
import { useDateFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useWorkspacePortfolios } from '@/shared/hooks/useWorkspacePortfolios';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ConfirmActionDialog } from '@/shared/components/feedback/ConfirmActionDialog';
import { unwrapApiData } from '@/shared/lib/api-response';
import { persistSelectedPortfolioId } from '@/shared/lib/workspace/notebook-state';
import { PortfolioDetails } from './PortfolioDetails';
import { PortfolioWorkspaceCard } from './PortfolioWorkspaceCard';
import { WorkspaceActionStrip } from './WorkspaceActionStrip';
import { WorkspaceStatusCard } from './WorkspaceStatusCard';
type NotebookStepItem = {
    id: string;
    title: string;
    description: string;
};
function SectionBlock({ title, description, children, }: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (<section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        {description ? (<p className="max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>) : null}
      </div>
      {children}
    </section>);
}
const EmptyPortfolioState = ({ onCreate, onCreateDemo, onImport, badgeLabel, title, description, createLabel, demoLabel, importLabel, steps, }: {
    onCreate: () => void;
    onCreateDemo: () => void;
    onImport: () => void;
    badgeLabel: string;
    title: string;
    description: string;
    createLabel: string;
    demoLabel: string;
    importLabel: string;
    steps: NotebookStepItem[];
}) => (<Card className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.92))] shadow-[0_22px_60px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
    <CardContent className="space-y-6 p-6 md:p-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-slate-700">
          <BookOpen className="h-3.5 w-3.5 text-primary"/>
          {badgeLabel}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="max-w-3xl text-sm leading-8 text-slate-600">
          {description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {steps.map((step) => (<div key={step.id} className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary"/>
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-[0.08em] text-slate-500">
                  {step.title}
                </p>
                <p className="text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
            </div>
          </div>))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onCreate} className="gap-2 rounded-2xl">
          <Plus className="h-4 w-4"/>
          {createLabel}
        </Button>
        <Button variant="outline" onClick={onCreateDemo} className="gap-2 rounded-2xl border-slate-200 bg-white/80">
          {demoLabel}
        </Button>
        <Button variant="outline" onClick={onImport} className="gap-2 rounded-2xl border-slate-200 bg-white/80">
          <Upload className="h-4 w-4"/>
          {importLabel}
        </Button>
      </div>
    </CardContent>
  </Card>);
const NotebookLoadingState = () => (<div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-[2rem]"/>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Skeleton className="h-56 w-full rounded-[2rem]"/>
      <Skeleton className="h-56 w-full rounded-[2rem]"/>
      <Skeleton className="h-56 w-full rounded-[2rem]"/>
    </div>
  </div>);
function NotebookMiniStat({ label, value, description, }: {
    label: string;
    value: string;
    description: string;
}) {
    return (<div className="rounded-[1.6rem] border border-white/80 bg-white/78 px-4 py-4 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
      <p className="text-xs font-semibold tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-[13px] leading-6 text-slate-600">{description}</p>
    </div>);
}
export const NotebookContainer: React.FC = () => {
    const { t, locale: language } = useAppI18n();
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [portfolioPendingDelete, setPortfolioPendingDelete] = useState<UserPortfolio | null>(null);
    const [isMutating, setIsMutating] = useState(false);
    const importRef = useRef<HTMLInputElement | null>(null);
    const { canManageWorkspace, isGuestWorkspace } = usePortfolioAccess();
    const dateFormatter = useDateFormatter(language);
    const {
        portfolios,
        selectedPortfolioId,
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
            id: 'create',
            title: t('notebook.ready_steps.create.title'),
            description: t('notebook.ready_steps.create.desc'),
        },
        {
            id: 'store',
            title: t('notebook.ready_steps.store.title'),
            description: t('notebook.ready_steps.store.desc'),
        },
        {
            id: 'inspect',
            title: t('notebook.ready_steps.inspect.title'),
            description: t('notebook.ready_steps.inspect.desc'),
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
    if (selectedPortfolioId && canManageWorkspace) {
        const portfolio = selectedPortfolio;
        return portfolio ? (<PortfolioDetails portfolio={portfolio} onDelete={handleDeletePortfolio} onPortfolioUpdate={mergePortfolioIntoState} onBack={() => {
                void fetchPortfolios();
                setSelectedPortfolioId(null);
            }}/>) : (<NotebookLoadingState />);
    }
    const notebookIntro = t('notebook.workspace_intro');
    const publicCount = portfolios.filter((portfolio) => portfolio.isPublic).length;
    const privateCount = portfolios.length - publicCount;
    return (<CalculatorPageShell title={t('notebook.title')} description={t('notebook.subtitle')} icon={<BookOpen className="h-8 w-8"/>} isCalculating={isLoading || isMutating} hasResults={portfolios.length > 0}>
      <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile}/>

      {error ? (<div className="rounded-[2rem] border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-3 font-semibold">
            <AlertCircle className="h-5 w-5"/>
            {error}
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchPortfolios}>
              <RefreshCcw className="h-4 w-4"/>
              {t('common.retry')}
            </Button>
          </div>
        </div>) : null}

      <SectionBlock title={t('notebook.workspace_scope_title')} description={notebookIntro}>
        <div className="space-y-4">
          <WorkspaceStatusCard
            isGuestWorkspace={isGuestWorkspace}
            canManageWorkspace={canManageWorkspace}
            selectedPortfolio={selectedPortfolio}
          />

          <WorkspaceActionStrip
            canManageWorkspace={canManageWorkspace}
            onImport={handleImportClick}
            onCreateDemo={handleCreateDemo}
            onRefresh={fetchPortfolios}
            onCreatePortfolio={handleCreateDefault}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <NotebookMiniStat label={t('notebook.portfolios_label')} value={String(portfolios.length)} description={t('notebook.portfolios_label_desc')}/>
            <NotebookMiniStat label={t('notebook.public_links_label')} value={String(publicCount)} description={t('notebook.public_links_label_desc')}/>
            <NotebookMiniStat label={t('notebook.private_drafts_label')} value={String(privateCount)} description={t('notebook.private_drafts_label_desc')}/>
          </div>
        </div>
      </SectionBlock>

      {isLoading ? (<NotebookLoadingState />) : portfolios.length === 0 ? (<EmptyPortfolioState onCreate={canManageWorkspace ? handleCreateDefault : () => {}} onCreateDemo={canManageWorkspace ? handleCreateDemo : () => {}} onImport={canManageWorkspace ? handleImportClick : () => {}} badgeLabel={t('notebook.empty_badge')} title={t('notebook.empty_title')} description={canManageWorkspace ? t('notebook.empty_desc') : t('workspace.empty_guest_description')} createLabel={canManageWorkspace ? t('notebook.create_first') : t('workspace.sign_in_required_short')} demoLabel={t('notebook.load_demo')} importLabel={t('notebook.import_json')} steps={emptyStateSteps}/>) : (<div className="space-y-8">
          <SectionBlock title={t('notebook.stored_portfolios')} description={t('notebook.stored_portfolios_desc')}>
            <div className="rounded-[1.8rem] border border-slate-200 bg-white/84 px-5 py-4 text-sm leading-7 text-slate-600 shadow-[0_18px_44px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
              {t('notebook.stored_portfolios_note')}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {portfolios.map((portfolio) => (<PortfolioWorkspaceCard
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
                  }}
                  onRequestDelete={() => {
                    setPortfolioPendingDelete(portfolio);
                  }}
                />))}
            </div>
          </SectionBlock>

          <Card className="rounded-[2rem] border border-slate-200 bg-white/82 shadow-[0_16px_42px_-38px_rgba(15,23,42,0.4)] backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <FolderOpen className="mt-0.5 h-5 w-5 text-primary"/>
                <div className="space-y-2">
                  <p className="text-xl font-black tracking-tight text-slate-950">
                    {t('notebook.scope_title')}
                  </p>
                  <p className="text-sm leading-7 text-slate-600">
                    {t('notebook.scope_desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>)}

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





