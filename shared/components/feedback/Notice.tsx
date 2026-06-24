import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NoticeTone = 'info' | 'warning' | 'success' | 'locked';

interface NoticeProps {
  tone?: NoticeTone;
  title?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

const toneClass: Record<NoticeTone, string> = {
  info: 'border-border bg-muted/25 text-muted-foreground',
  warning: 'border-warning/30 bg-warning/5 text-foreground',
  success: 'border-success/30 bg-success/5 text-foreground',
  locked: 'border-border bg-muted/35 text-muted-foreground',
};

const toneIcon = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  locked: Lock,
} as const;

export function Notice({
  tone = 'info',
  title,
  children,
  compact = false,
  className,
}: NoticeProps) {
  const Icon = toneIcon[tone];

  return (
    <div
      className={cn(
        'rounded-md border text-sm leading-6',
        toneClass[tone],
        compact ? 'px-3 py-2' : 'px-4 py-3',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          {title ? <p className="font-semibold text-foreground">{title}</p> : null}
          <div className={cn(title && 'mt-1')}>{children}</div>
        </div>
      </div>
    </div>
  );
}
