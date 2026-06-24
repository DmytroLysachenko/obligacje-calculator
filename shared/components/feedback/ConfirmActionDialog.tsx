'use client';

import { AlertTriangle } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-dialog-title"
      aria-describedby="confirm-action-dialog-description"
    >
      <div className="w-full max-w-md border border-border bg-background p-6 shadow-none">
        <div className="flex items-start gap-3">
          <div className="border-l-2 border-warning px-3 py-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 id="confirm-action-dialog-title" className="ui-card-title">
              {title}
            </h3>
            <p id="confirm-action-dialog-description" className="ui-body text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="outline" className="rounded-md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              void onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
