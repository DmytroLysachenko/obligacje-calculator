'use client';

import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/82 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.42)] backdrop-blur transition-transform hover:-translate-y-0.5">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-600">
              {statusLabel}
            </span>
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
        </div>

        <div className="space-y-2">
          <p className="text-xl font-black tracking-tight text-slate-950">
            {portfolio.name}
          </p>
          <p className="text-sm leading-7 text-slate-600">
            {portfolio.description || fallbackDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-slate-500">
              {createdAtLabel}
            </p>
            <p className="mt-2 font-medium text-slate-900">
              {portfolio.createdAtLabelValue}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-slate-500">
              {usageLabel}
            </p>
            <p className="mt-2 font-medium text-slate-900">{usageDescription}</p>
          </div>
        </div>

        <Button
          className="w-full rounded-2xl"
          disabled={!canManageWorkspace}
          onClick={onOpen}
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
