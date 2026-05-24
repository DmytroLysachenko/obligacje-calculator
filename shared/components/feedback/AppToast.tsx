'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
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
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      <div
        className={cn(
          'pointer-events-auto flex min-w-[280px] max-w-[420px] items-start gap-3 rounded-[1.4rem] border px-4 py-3 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.55)] backdrop-blur',
          isSuccess
            ? 'border-emerald-200 bg-emerald-950 text-white'
            : 'border-destructive/30 bg-white text-slate-950',
        )}
      >
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', isSuccess ? 'text-emerald-300' : 'text-destructive')} />
        <p className="flex-1 text-sm leading-6">{message}</p>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full',
            isSuccess
              ? 'text-white hover:bg-white/10 hover:text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
          )}
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
