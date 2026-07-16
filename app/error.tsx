'use client';

import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
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
      <section className="w-full max-w-md space-y-6 border-t border-border py-8 text-center">
        <div className="inline-flex bg-muted p-4 text-destructive">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="ui-page-title">We couldn’t complete that calculation</h1>
          <p className="ui-body text-muted-foreground">
            The calculation encountered an unexpected issue. Reset the current view and try again.
          </p>
        </div>

        {error.digest && (
          <div className="border-y border-border bg-muted/30 px-3 py-2">
            <code className="ui-meta font-mono text-muted-foreground">
              Reference: {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => reset()}
            className="h-11 gap-2 font-semibold transition-colors active:translate-y-px"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset & try again
          </Button>

          <Button variant="outline" asChild className="h-11 font-semibold">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Return to dashboard
            </Link>
          </Button>
        </div>

        <p className="ui-meta text-muted-foreground/70">Obligacje Calculator</p>
      </section>
    </div>
  );
}
