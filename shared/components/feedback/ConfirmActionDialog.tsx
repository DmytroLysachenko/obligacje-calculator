'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-warning/10 p-3 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 className="ui-card-title">{title}</h3>
            <p className="ui-body text-muted-foreground">{description}</p>
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
