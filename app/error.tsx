'use client';

import { useEffect } from 'react';

import { FeedbackState } from '@/shared/components/feedback/FeedbackState';
import { logClientError } from '@/shared/lib/client-logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError('[GlobalError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <FeedbackState
        tone="error"
        eyebrow="Obligacje Calculator"
        title="We couldn’t complete that calculation"
        description="The calculation encountered an unexpected issue. Reset the current view and try again."
        action={{ label: 'Reset & try again', onClick: reset }}
        secondaryAction={{ label: 'Return to dashboard', href: '/' }}
        className="w-full max-w-xl"
      >
        {error.digest ? (
          <p className="ui-caption">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}
      </FeedbackState>
    </div>
  );
}
