'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type QuerySyncValue = string | number | boolean | undefined | null;

export function useQuerySync<T extends object>(
  state: T,
  onLoad: (initialState: Partial<T>) => void
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);
  const onLoadRef = useRef(onLoad);
  
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  // Load from URL on mount
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const initial: Partial<T> = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Try to parse numbers or booleans
      let parsedValue: QuerySyncValue = value;
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      else if (value !== '' && !isNaN(Number(value))) parsedValue = Number(value);
      
      (initial as Record<string, QuerySyncValue>)[key] = parsedValue;
    }

    if (Object.keys(initial).length > 0) {
      onLoadRef.current(initial);
    }
    isInitialMount.current = false;
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Sync to URL on state change
  const stateString = JSON.stringify(state);
  
  const updateUrl = useCallback(() => {
    if (isInitialMount.current) return;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }

    const query = params.toString();
    const currentQuery = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : window.location.search;
    
    // Only update if the query actually changed to avoid infinite loops
    if (query !== currentQuery) {
      const url = query ? `${pathname}?${query}` : pathname;
      // Use history.replaceState for a 'silent' update that doesn't trigger Next.js RSC data fetches
      window.history.replaceState({ ...window.history.state, as: url, url }, '', url);
    }
  }, [state, pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl();
    }, 500);
    return () => clearTimeout(timer);
  }, [stateString, updateUrl]);
}
