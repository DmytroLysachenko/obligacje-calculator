'use client';

import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortfolioWorkspaceCardProps {
  portfolio: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean | null;
    createdAtLabelValue: string;
  };
  createdAtLabel: string;
  usageLabel: string;
  usageDescription: string;
  statusLabel: string;
  fallbackDescription: string;
  actionLabel: string;
  canManageWorkspace: boolean;
  onOpen: () => void;
  onRequestDelete: () => void;
}

export function PortfolioWorkspaceCard({
  portfolio,
  createdAtLabel,
  usageLabel,
  usageDescription,
  statusLabel,
  fallbackDescription,
  actionLabel,
  canManageWorkspace,
  onOpen,
  onRequestDelete,
}: PortfolioWorkspaceCardProps) {
  return (
    <article className="space-y-4 border-t border-border py-5 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="border-l-2 border-border pl-3 pt-0.5 text-foreground">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold tracking-tight text-foreground">
                {portfolio.name}
              </p>
              <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
                {statusLabel}
              </span>
            </div>
            <p className="ui-body">
              {portfolio.description || fallbackDescription}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-md text-muted-foreground hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onRequestDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-0 divide-y divide-dashed divide-border border-y border-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="py-3 md:pr-4">
          <p className="ui-metadata text-muted-foreground">
            {createdAtLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {portfolio.createdAtLabelValue}
          </p>
        </div>
        <div className="py-3 md:pl-4">
          <p className="ui-metadata text-muted-foreground">
            {usageLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{usageDescription}</p>
        </div>
      </div>

      <Button
        className="w-full rounded-md"
        disabled={!canManageWorkspace}
        onClick={onOpen}
      >
        {actionLabel}
      </Button>
    </article>
  );
}
