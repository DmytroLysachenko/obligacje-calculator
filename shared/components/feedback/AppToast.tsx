'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AppToastTone = 'success' | 'error';

interface AppToastProps {
  message: string | null;
  tone?: AppToastTone;
  onDismiss?: () => void;
  durationMs?: number;
}

export function AppToast({
  message,
  tone = 'success',
  onDismiss,
  durationMs = 3200,
}: AppToastProps) {
  useEffect(() => {
    if (!message || !onDismiss) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => window.clearTimeout(timeout);
  }, [durationMs, message, onDismiss]);

  if (!message) {
    return null;
  }

  const isSuccess = tone === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'pointer-events-auto flex min-w-[280px] max-w-[420px] items-start gap-3 border border-l-2 bg-background px-4 py-3 shadow-none',
          isSuccess
            ? 'border-border border-l-success text-foreground'
            : 'border-border border-l-destructive text-foreground',
        )}
      >
        <Icon
          className={cn('mt-0.5 h-5 w-5 shrink-0', isSuccess ? 'text-success' : 'text-destructive')}
        />
        <p className="flex-1 text-sm leading-6">{message}</p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss notification"
          className={cn(
            'h-8 w-8 rounded-full',
            isSuccess
              ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
