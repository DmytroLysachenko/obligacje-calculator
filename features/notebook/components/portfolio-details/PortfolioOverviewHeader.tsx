'use client';

import React from 'react';
import { ArrowLeft, Check, Download, Loader2, Share2, ShieldCheck, Trash2 } from 'lucide-react';
import { UserPortfolio } from '@/db/schema';
import { Button } from '@/components/ui/button';

function PortfolioMiniStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="border-t border-border py-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

type PortfolioOverviewHeaderProps = {
  portfolio: UserPortfolio;
  lotsCount: number;
  nextMaturityDate: Date | null;
  nextMaturityType: string | null;
  totalInvestedValue: string;
  isPublic: boolean;
  isSharing: boolean;
  justCopied: boolean;
  formatDate: (value: Date) => string;
  onBack: () => void;
  onExport: (formatName: 'portfolio' | 'package') => void;
  onToggleShare: () => void;
  onCopyLink: () => void;
  onDeleteRequest: () => void;
  canDelete: boolean;
  t: (key: string, values?: Record<string, string>) => string;
};

export function PortfolioOverviewHeader({
  portfolio,
  lotsCount,
  nextMaturityDate,
  nextMaturityType,
  totalInvestedValue,
  isPublic,
  isSharing,
  justCopied,
  formatDate,
  onBack,
  onExport,
  onToggleShare,
  onCopyLink,
  onDeleteRequest,
  canDelete,
  t,
}: PortfolioOverviewHeaderProps) {
  return (
    <>
      <section className="space-y-6 border-t border-border py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="ui-meta font-semibold">{t('notebook.record_view')}</p>
            <h3 className="ui-section-title">{t('notebook.record_intro_title')}</h3>
            <p className="ui-body">{t('notebook.record_intro_desc')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <PortfolioMiniStat
              label={t('notebook.stored_lots_label')}
              value={String(lotsCount)}
              description={t('notebook.stored_lots_card_desc')}
            />
            <PortfolioMiniStat
              label={t('notebook.next_maturity_label')}
              value={nextMaturityDate ? formatDate(nextMaturityDate) : '-'}
              description={t('notebook.next_maturity_card_desc')}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <PortfolioMiniStat
            label={t('notebook.total_invested')}
            value={totalInvestedValue}
            description={t('notebook.total_invested_desc')}
          />
          <PortfolioMiniStat
            label={t('notebook.next_maturity')}
            value={nextMaturityType ?? '-'}
            description={
              nextMaturityDate
                ? `${formatDate(nextMaturityDate)} ${t('notebook.next_maturity_suffix')}`
                : t('notebook.no_upcoming_maturity')
            }
          />
          <PortfolioMiniStat
            label={t('notebook.sharing_mode')}
            value={isPublic ? t('notebook.public') : t('notebook.private')}
            description={
              isPublic ? t('notebook.public_share_desc') : t('notebook.private_share_desc')
            }
          />
        </div>
      </section>

      <div className="flex flex-col gap-4 border-t border-border py-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="ui-section-title">{portfolio.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {portfolio.description || t('notebook.portfolio_details')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => onExport('package')}>
            <Download className="h-4 w-4" />
            {t('notebook.export_package')}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => onExport('portfolio')}>
            <Download className="h-4 w-4" />
            {t('notebook.export_summary')}
          </Button>
          {canDelete ? (
            <Button
              variant="outline"
              className="gap-2 border-destructive/20 bg-background text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={onDeleteRequest}
            >
              <Trash2 className="h-4 w-4" />
              {t('notebook.delete_portfolio')}
            </Button>
          ) : null}
          {isPublic ? (
            <Button variant="outline" className="gap-2" onClick={onCopyLink}>
              {justCopied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {justCopied ? t('common.copied') : t('common.copy_link')}
            </Button>
          ) : null}
          <Button
            variant={isPublic ? 'default' : 'outline'}
            className="gap-2"
            onClick={onToggleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {isPublic ? t('notebook.public') : t('notebook.private')}
          </Button>
        </div>
      </div>
    </>
  );
}
