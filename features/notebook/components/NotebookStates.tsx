import { BookOpen, CheckCircle2, Plus, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { type NotebookStepItem } from '@/features/notebook/lib/notebook-workspace-model';
import { Notice } from '@/shared/components/feedback/Notice';

interface EmptyPortfolioStateProps {
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
}

export function EmptyPortfolioState({
  onCreate,
  onCreateDemo,
  onImport,
  badgeLabel,
  title,
  description,
  createLabel,
  demoLabel,
  importLabel,
  capabilitiesTitle,
  capabilities,
  canManageWorkspace,
}: EmptyPortfolioStateProps) {
  return (
    <section className="space-y-6 border-t border-border py-8">
      <div className="space-y-3">
        <div className="surface-chip">
          <BookOpen className="h-3.5 w-3.5 text-foreground" />
          {badgeLabel}
        </div>
        <h3 className="ui-section-title">{title}</h3>
        <p className="ui-body max-w-3xl">{description}</p>
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
            <div
              key={capability.id}
              className="border-t border-border pt-4 first:border-t-0 first:pt-0 md:border-t-0 md:pt-0"
            >
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
          <Plus className="h-4 w-4" />
          {createLabel}
        </Button>
        <Button
          variant="outline"
          onClick={onCreateDemo}
          className="gap-2 rounded-md border-border"
          disabled={!canManageWorkspace}
        >
          {demoLabel}
        </Button>
        <Button
          variant="ghost"
          onClick={onImport}
          className="gap-2 rounded-md"
          disabled={!canManageWorkspace}
        >
          <Upload className="h-4 w-4" />
          {importLabel}
        </Button>
      </div>
    </section>
  );
}

export function NotebookLoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    </div>
  );
}
