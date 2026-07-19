import { AlertTriangle, CheckCircle2, CircleAlert, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FeedbackStateTone = 'info' | 'loading' | 'success' | 'warning' | 'error';

export interface FeedbackStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline';
}

interface FeedbackStateProps {
  tone?: FeedbackStateTone;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  action?: FeedbackStateAction;
  secondaryAction?: FeedbackStateAction;
  className?: string;
}

const toneConfig: Record<
  FeedbackStateTone,
  { icon: React.ComponentType<{ className?: string }>; accent: string }
> = {
  info: { icon: Info, accent: 'border-l-border' },
  loading: { icon: Loader2, accent: 'border-l-border' },
  success: { icon: CheckCircle2, accent: 'border-l-success' },
  warning: { icon: AlertTriangle, accent: 'border-l-warning' },
  error: { icon: CircleAlert, accent: 'border-l-destructive' },
};

function FeedbackAction({ action }: { action: FeedbackStateAction }) {
  if (action.href) {
    return (
      <Button asChild variant={action.variant ?? 'default'}>
        {action.href.startsWith('/') ? (
          <Link href={action.href}>{action.label}</Link>
        ) : (
          <a href={action.href}>{action.label}</a>
        )}
      </Button>
    );
  }

  return (
    <Button type="button" variant={action.variant ?? 'default'} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function FeedbackState({
  tone = 'info',
  eyebrow,
  title,
  description,
  children,
  action,
  secondaryAction,
  className,
}: FeedbackStateProps) {
  const { icon: Icon, accent } = toneConfig[tone];
  const loading = tone === 'loading';

  return (
    <section
      className={cn('ui-empty-state border-l-2 px-5 text-left', accent, className)}
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      aria-live={tone === 'error' || tone === 'warning' ? 'assertive' : 'polite'}
    >
      <div className="ui-empty-state-content mx-0 max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="ui-icon-tile" aria-hidden="true">
            <Icon className={cn('h-5 w-5', loading && 'animate-spin')} />
          </div>
          <div className="min-w-0 space-y-2">
            {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
            <h2 className="ui-section-title">{title}</h2>
            {description ? (
              <div className="ui-body ui-pretty text-muted-foreground">{description}</div>
            ) : null}
          </div>
        </div>
        {children ? <div className="ui-disclosure-body mt-5">{children}</div> : null}
        {action || secondaryAction ? (
          <div className="ui-empty-state-actions justify-start">
            {action ? <FeedbackAction action={action} /> : null}
            {secondaryAction ? <FeedbackAction action={secondaryAction} /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
