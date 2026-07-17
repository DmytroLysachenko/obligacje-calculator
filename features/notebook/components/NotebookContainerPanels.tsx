'use client';

import { FolderOpen } from 'lucide-react';

import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { UserPortfolio } from '@/shared/types/portfolio';

import { PortfolioWorkspaceCard } from './PortfolioWorkspaceCard';

interface NotebookPortfolioListSectionProps {
  portfolios: UserPortfolio[];
  canManageWorkspace: boolean;
  formatDate: (date: Date) => string;
  labels: {
    title: string;
    description: string;
    note: string;
    created: string;
    usage: string;
    usageDescription: string;
    statusPublic: string;
    statusPrivate: string;
    fallbackDescription: string;
    openPortfolio: string;
    signInRequired: string;
  };
  onOpenPortfolio: (portfolio: UserPortfolio) => void;
  onRequestDelete: (portfolio: UserPortfolio) => void;
}

export function NotebookPortfolioListSection({
  portfolios,
  canManageWorkspace,
  formatDate,
  labels,
  onOpenPortfolio,
  onRequestDelete,
}: NotebookPortfolioListSectionProps) {
  return (
    <SectionBlock title={labels.title} description={labels.description}>
      <div className="border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
        {labels.note}
      </div>

      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        role="list"
        aria-label={labels.title}
      >
        {portfolios.map((portfolio) => (
          <div key={portfolio.id} role="listitem">
            <PortfolioWorkspaceCard
              portfolio={{
                id: portfolio.id,
                name: portfolio.name,
                description: portfolio.description,
                isPublic: portfolio.isPublic,
                createdAtLabelValue: formatDate(new Date(portfolio.createdAt!)),
              }}
              createdAtLabel={labels.created}
              usageLabel={labels.usage}
              usageDescription={labels.usageDescription}
              statusLabel={portfolio.isPublic ? labels.statusPublic : labels.statusPrivate}
              fallbackDescription={labels.fallbackDescription}
              actionLabel={canManageWorkspace ? labels.openPortfolio : labels.signInRequired}
              canManageWorkspace={canManageWorkspace}
              onOpen={() => onOpenPortfolio(portfolio)}
              onRequestDelete={() => onRequestDelete(portfolio)}
            />
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

export function NotebookScopeNote({ title, description }: { title: string; description: string }) {
  return (
    <section className="surface-shell flex items-start gap-3 p-5">
      <FolderOpen className="mt-0.5 h-5 w-5 text-foreground" />
      <div className="space-y-2">
        <p className="ui-card-title">{title}</p>
        <p className="ui-body">{description}</p>
      </div>
    </section>
  );
}
