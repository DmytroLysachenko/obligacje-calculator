'use client';

import { RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ConfirmActionDialog } from '@/shared/components/feedback/ConfirmActionDialog';
import { Notice } from '@/shared/components/feedback/Notice';
import { UserPortfolio } from '@/shared/types/portfolio';

interface NotebookErrorNoticeProps {
  error: string | null;
  retryLabel: string;
  onRetry: () => void;
}

export function NotebookErrorNotice({ error, retryLabel, onRetry }: NotebookErrorNoticeProps) {
  if (!error) {
    return null;
  }

  return (
    <Notice tone="warning" title={error}>
      <div className="mt-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4" />
          {retryLabel}
        </Button>
      </div>
    </Notice>
  );
}

interface NotebookWorkspaceFeedbackProps {
  portfolioPendingDelete: UserPortfolio | null;
  statusMessage: string | null;
  labels: {
    deletePortfolio: string;
    confirmDeletePortfolio: (name: string) => string;
    delete: string;
    cancel: string;
  };
  onCancelDelete: () => void;
  onConfirmDelete: (portfolio: UserPortfolio) => Promise<void>;
  onDismissToast: () => void;
}

export function NotebookWorkspaceFeedback({
  portfolioPendingDelete,
  statusMessage,
  labels,
  onCancelDelete,
  onConfirmDelete,
  onDismissToast,
}: NotebookWorkspaceFeedbackProps) {
  return (
    <>
      <ConfirmActionDialog
        open={!!portfolioPendingDelete}
        title={labels.deletePortfolio}
        description={
          portfolioPendingDelete ? labels.confirmDeletePortfolio(portfolioPendingDelete.name) : ''
        }
        confirmLabel={labels.delete}
        cancelLabel={labels.cancel}
        onCancel={onCancelDelete}
        onConfirm={async () => {
          if (portfolioPendingDelete) {
            await onConfirmDelete(portfolioPendingDelete);
          }
        }}
      />

      <AppToast message={statusMessage} onDismiss={onDismissToast} />
    </>
  );
}
