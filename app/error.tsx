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
    // Log the error to an error reporting service
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border-2 border-primary/5 p-8 text-center space-y-6">
        <div className="relative inline-block">
          <div className="absolute -inset-1 rounded-full bg-red-500/20 blur-lg animate-pulse" />
          <div className="relative bg-red-50 p-6 rounded-full border-2 border-red-100">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
            Engine Stall Detected
          </h1>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            The calculation engine encountered an unexpected exception. Your data is safe, but we need to reset the current state.
          </p>
        </div>

        {error.digest && (
          <div className="bg-muted/30 p-2 rounded-lg border border-dashed">
            <code className="text-[10px] font-mono text-muted-foreground uppercase">
              Incident ID: {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={() => reset()}
            className="h-12 rounded-xl font-black gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <RefreshCcw className="h-4 w-4" />
            RESTART ENGINE
          </Button>
          
          <Button 
            variant="outline"
            asChild
            className="h-12 rounded-xl font-bold border-2"
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              BACK TO BASE
            </Link>
          </Button>
        </div>

        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          Obligacje Calculator • Reliability Layer v2.1
        </p>
      </div>
    </div>
  );
}
