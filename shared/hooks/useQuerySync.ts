'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useQuerySync<T extends Record<string, any>>(
  state: T,
  onLoad: (initialState: Partial<T>) => void
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);

  // Load from URL on mount
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const initial: Partial<T> = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Try to parse numbers or booleans
      if (value === 'true') (initial as any)[key] = true;
      else if (value === 'false') (initial as any)[key] = false;
      else if (!isNaN(Number(value))) (initial as any)[key] = Number(value);
      else (initial as any)[key] = value;
    }

    if (Object.keys(initial).length > 0) {
      onLoad(initial);
    }
    isInitialMount.current = false;
  }, []); // Only on mount

  // Sync to URL on state change
  useEffect(() => {
    if (isInitialMount.current) return;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    
    // Use replace to avoid polluting history with every slider tick
    router.replace(url, { scroll: false });
  }, [state, pathname, router]);
}
