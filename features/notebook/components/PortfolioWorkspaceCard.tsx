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
    <article className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-900">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-black tracking-tight text-slate-950">
                {portfolio.name}
              </p>
              <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-slate-600">
                {statusLabel}
              </span>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              {portfolio.description || fallbackDescription}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-slate-500 hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onRequestDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-0 rounded-[1.25rem] border border-slate-200 md:grid-cols-2">
        <div className="border-b border-dashed border-slate-200 px-4 py-3 md:border-b-0 md:border-r">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            {createdAtLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {portfolio.createdAtLabelValue}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            {usageLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{usageDescription}</p>
        </div>
      </div>

      <Button
        className="w-full rounded-2xl"
        disabled={!canManageWorkspace}
        onClick={onOpen}
      >
        {actionLabel}
      </Button>
    </article>
  );
}
