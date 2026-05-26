"use client";
import React, { useCallback, useState } from 'react';
import { UserPortfolio } from '@/db/schema';
import { useAppI18n } from '@/i18n/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { ConfirmActionDialog } from '@/shared/components/feedback/ConfirmActionDialog';
import { useCurrencyFormatter, useDateFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { usePortfolioDetailsWorkspace } from '@/features/notebook/hooks/usePortfolioDetailsWorkspace';
import { PortfolioOverviewHeader } from './portfolio-details/PortfolioOverviewHeader';
import { PortfolioLotsTab } from './portfolio-details/PortfolioLotsTab';
import { PortfolioAnalyticsTab } from './portfolio-details/PortfolioAnalyticsTab';
interface PortfolioDetailsProps {
    portfolio: UserPortfolio;
    onBack: () => void;
    onDelete?: (portfolio: UserPortfolio) => Promise<void> | void;
    onPortfolioUpdate?: (portfolio: UserPortfolio) => void;
}
export const PortfolioDetails: React.FC<PortfolioDetailsProps> = ({ portfolio, onBack, onDelete, onPortfolioUpdate, }) => {
    const { t, locale: language } = useAppI18n();
    const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const currencyFormatter = useCurrencyFormatter(language, {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    });
    const dateFormatter = useDateFormatter(language);
    const formatCurrency = useCallback((value: number) => currencyFormatter.format(value), [currencyFormatter]);
    const {
        lots,
        isLoading,
        simulation,
        isSimulating,
        isPublic,
        isSharing,
        justCopied,
        maturityWindowDays,
        setMaturityWindowDays,
        totalValue,
        filteredMaturities,
        upcomingCashflow,
        nextMaturity,
        handleToggleShare,
        copyToClipboard,
        handleExport,
    } = usePortfolioDetailsWorkspace({
        portfolio,
        definitions,
        onPortfolioUpdate,
    });
    const maturityWindowLabel = t('notebook.next_days_window', {
        days: String(maturityWindowDays),
    });
    if (isLoadingDefs || !definitions) {
        return (<div className="space-y-4">
        <div className="h-10 w-40 rounded bg-muted"/>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-32 rounded bg-muted"/>
          <div className="h-32 rounded bg-muted"/>
          <div className="h-32 rounded bg-muted"/>
        </div>
      </div>);
    }
    return (<div className="space-y-6 pb-16">
      <PortfolioOverviewHeader portfolio={portfolio} lotsCount={lots.length} nextMaturityDate={nextMaturity?.maturityDate ?? null} nextMaturityType={nextMaturity?.bondType ?? null} totalInvestedValue={formatCurrency(totalValue)} isPublic={isPublic} isSharing={isSharing} justCopied={justCopied} formatDate={(value) => dateFormatter.format(value)} onBack={onBack} onExport={handleExport} onToggleShare={handleToggleShare} onCopyLink={copyToClipboard} onDeleteRequest={() => setIsDeleteDialogOpen(true)} canDelete={Boolean(onDelete)} t={t}/>

      <Tabs defaultValue="lots" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 md:w-fit">
          <TabsTrigger value="lots">{t('notebook.lots_tab')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('notebook.analytics_tab_short')}</TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="space-y-6">
          <PortfolioLotsTab isLoading={isLoading} lots={lots} definitions={definitions} language={language} formatCurrency={formatCurrency} maturityWindowDays={maturityWindowDays} onWindowChange={setMaturityWindowDays} filteredMaturities={filteredMaturities} upcomingCashflow={upcomingCashflow} maturityWindowLabel={maturityWindowLabel} t={t}/>
        </TabsContent>

        <TabsContent value="analytics">
          <PortfolioAnalyticsTab simulation={simulation} isSimulating={isSimulating} formatCurrency={formatCurrency} t={t}/>
        </TabsContent>
      </Tabs>

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        title={t('notebook.delete_portfolio')}
        description={t('notebook.confirm_delete_portfolio_full', {
          name: portfolio.name,
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          setIsDeleteDialogOpen(false);
          if (onDelete) {
            await onDelete(portfolio);
            onBack();
          }
        }}
      />
    </div>);
};




