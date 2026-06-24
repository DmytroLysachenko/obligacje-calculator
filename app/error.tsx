'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md space-y-6 border-t border-border py-8 text-center">
        <div className="relative inline-block">
          <div className="relative rounded-lg bg-muted p-6">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-[32px] font-semibold leading-tight text-foreground">
            Engine Stall Detected
          </h1>
          <p className="ui-body text-muted-foreground">
            The calculation engine encountered an unexpected exception. Your data is safe, but we
            need to reset the current state.
          </p>
        </div>

        {error.digest && (
          <div className="rounded-lg bg-muted/30 p-2">
            <code className="ui-metadata font-mono text-muted-foreground">
              Incident ID: {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => reset()}
            className="h-12 gap-2 rounded-lg font-semibold transition-all active:scale-95"
          >
            <RefreshCcw className="h-4 w-4" />
            RESTART ENGINE
          </Button>

          <Button variant="outline" asChild className="h-12 rounded-lg font-semibold">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              BACK TO BASE
            </Link>
          </Button>
        </div>

        <p className="ui-metadata text-muted-foreground/70">
          Obligacje Calculator • Reliability Layer v2.1
        </p>
      </section>
    </div>
  );
}
