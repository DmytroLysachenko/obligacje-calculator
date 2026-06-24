'use client';

import Link from 'next/link';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SecondarySurfaceIntroAction {
  href: string;
  label: string;
  variant?: 'default' | 'outline';
}

interface SecondarySurfaceIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: SecondarySurfaceIntroAction[];
  tone?: 'neutral' | 'amber';
}

export function SecondarySurfaceIntro({
  eyebrow,
  title,
  description,
  actions = [],
  tone = 'neutral',
}: SecondarySurfaceIntroProps) {
  return (
    <section
      className={cn(
        'space-y-4 border-y py-5 md:py-6',
        tone === 'amber' ? 'border-warning/40 bg-warning/5' : 'border-border',
      )}
    >
      <div className="ui-meta font-semibold">{eyebrow}</div>
      <div className="space-y-3">
        <h1 className="ui-section-title">{title}</h1>
        <p className="ui-body max-w-4xl">{description}</p>
      </div>
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          {actions.map((action) => (
            <Button
              key={`${action.href}-${action.label}`}
              asChild
              variant={action.variant ?? 'default'}
              className={cn(
                'rounded-md',
                action.variant === 'outline' ? 'border-border' : undefined,
              )}
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
