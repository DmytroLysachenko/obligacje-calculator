'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/i18n';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  FolderOpen,
  Plus,
  RefreshCcw,
  Upload,
} from 'lucide-react';
import { UserPortfolio } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalculatorPageShell } from '@/shared/components/CalculatorPageShell';
import { PortfolioDetails } from './PortfolioDetails';

const EmptyPortfolioState = ({
  onCreate,
  onCreateDemo,
  onImport,
  badgeLabel,
  title,
  description,
  actionsLabel,
  createLabel,
  demoLabel,
  importLabel,
  steps,
}: {
  onCreate: () => void;
  onCreateDemo: () => void;
  onImport: () => void;
  badgeLabel: string;
  title: string;
  description: string;
  actionsLabel: string;
  createLabel: string;
  demoLabel: string;
  importLabel: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
}) => (
  <div className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            {badgeLabel}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h3>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => (
            <ReadyStep
              key={step.title}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-slate-50 p-5">
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {actionsLabel}
          </p>
          <Button onClick={onCreate} className="h-11 w-full font-semibold">
            {createLabel}
          </Button>
          <Button variant="outline" onClick={onCreateDemo} className="h-11 w-full font-semibold">
            {demoLabel}
          </Button>
          <Button variant="outline" onClick={onImport} className="h-11 w-full font-semibold">
            {importLabel}
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const NotebookLoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-24 w-full rounded-2xl" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Skeleton className="h-52 w-full rounded-2xl" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      <Skeleton className="h-52 w-full rounded-2xl" />
    </div>
  </div>
);

const ReadyStep = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border bg-white p-4">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

export const NotebookContainer: React.FC = () => {
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState<UserPortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  const resolvePortfolioError = useCallback(
    (payload?: { error?: string; code?: string } | null) => {
      if (payload?.code === 'portfolio_storage_unavailable') {
        return t('notebook.storage_unavailable');
      }

      return payload?.error || t('notebook.create_error');
    },
    [t],
  );

  const fetchPortfolios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();

      if (!response.ok) {
        setError(resolvePortfolioError(data));
        setPortfolios([]);
        return;
      }

      if (!Array.isArray(data) && data?.error) {
        setError(resolvePortfolioError(data));
      }

      setPortfolios(Array.isArray(data) ? data : (data.items ?? []));
    } catch {
      setError(t('notebook.load_error'));
      setPortfolios([]);
    } finally {
      setIsLoading(false);
    }
  }, [resolvePortfolioError, t]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const emptyStateSteps = [
    {
      title: t('notebook.ready_steps.create.title'),
      description: t('notebook.ready_steps.create.desc'),
    },
    {
      title: t('notebook.ready_steps.store.title'),
      description: t('notebook.ready_steps.store.desc'),
    },
    {
      title: t('notebook.ready_steps.inspect.title'),
      description: t('notebook.ready_steps.inspect.desc'),
    },
  ];

  const handleCreateDefault = async () => {
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: t('notebook.new_portfolio'),
          description: t('notebook.default_description'),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(resolvePortfolioError(payload));
        return;
      }

      setError(null);
      await fetchPortfolios();
    } catch (caughtError) {
      console.error(caughtError);
      setError(t('notebook.create_error'));
    }
  };

  const handleCreateDemo = async () => {
    setIsLoading(true);

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
        throw new Error('Failed to create portfolio');
      }

      const portfolio = await response.json();
      const portfolioId = portfolio.data?.id || portfolio.id;
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

      await fetchPortfolios();
    } catch (caughtError) {
      console.error(caughtError);
      setError(t('notebook.create_error'));
    } finally {
      setIsLoading(false);
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
      const text = await file.text();
      const parsed = JSON.parse(text);
      const response = await fetch('/api/portfolio/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      setError(null);
      await fetchPortfolios();
    } catch (caughtError) {
      console.error(caughtError);
      setError('Import failed. Use the portfolio export JSON package.');
    } finally {
      event.target.value = '';
    }
  };

  if (selectedPortfolioId) {
    const portfolio = portfolios.find((item) => item.id === selectedPortfolioId);

    return portfolio ? (
      <PortfolioDetails
        portfolio={portfolio}
        onBack={() => setSelectedPortfolioId(null)}
      />
    ) : null;
  }

  return (
    <CalculatorPageShell
      title={t('notebook.title')}
      description={t('notebook.subtitle')}
      icon={<BookOpen className="h-8 w-8" />}
      isCalculating={isLoading}
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
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-3 font-semibold">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchPortfolios}
            >
              <RefreshCcw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="rounded-2xl border shadow-none">
        <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t('notebook.guest_mode')}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('notebook.guest_desc')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleImportClick} className="gap-2">
              <Upload className="h-4 w-4" />
              {t('notebook.import_json')}
            </Button>
            <Button variant="outline" onClick={handleCreateDemo}>
              {t('notebook.load_demo')}
            </Button>
            <Button variant="outline" onClick={fetchPortfolios} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              {t('common.refresh')}
            </Button>
            <Button onClick={handleCreateDefault} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('notebook.new_portfolio')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <NotebookLoadingState />
      ) : portfolios.length === 0 ? (
        <EmptyPortfolioState
          onCreate={handleCreateDefault}
          onCreateDemo={handleCreateDemo}
          onImport={handleImportClick}
          badgeLabel={t('notebook.empty_badge')}
          title={t('notebook.empty_title')}
          description={t('notebook.empty_desc')}
          actionsLabel={t('common.actions')}
          createLabel={t('notebook.create_first')}
          demoLabel={t('notebook.load_demo')}
          importLabel={t('notebook.import_json')}
          steps={emptyStateSteps}
        />
      ) : (
        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-none">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg font-black tracking-tight">
                {t('notebook.stored_portfolios')}
              </CardTitle>
              <CardDescription>
                {t('notebook.stored_portfolios_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {portfolios.map((portfolio) => (
                <Card key={portfolio.id} className="rounded-2xl border shadow-none">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-xl border bg-muted/30 p-3 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                        {portfolio.isPublic ? t('notebook.status_public') : t('notebook.status_private')}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-xl">{portfolio.name}</CardTitle>
                      <CardDescription className="mt-2 leading-6">
                        {portfolio.description || t('notebook.portfolio_details')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-xl border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t('common.created')}
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {new Date(portfolio.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t('notebook.usage_label')}
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {t('notebook.usage_desc')}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => setSelectedPortfolioId(portfolio.id)}
                    >
                      {t('notebook.open_portfolio')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <div className="rounded-2xl border bg-muted/20 p-5">
            <div className="flex items-start gap-3">
              <FolderOpen className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">{t('notebook.scope_title')}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t('notebook.scope_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </CalculatorPageShell>
  );
};
