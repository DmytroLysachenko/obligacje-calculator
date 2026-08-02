'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

/** Moves keyboard context to the page heading area only after client navigation. */
export function RouteFocusManager() {
  const pathname = usePathname();
  const previousPathname = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (previousPathname.current && previousPathname.current !== pathname) {
      window.requestAnimationFrame(() => document.getElementById('main-content')?.focus());
    }
    previousPathname.current = pathname;
  }, [pathname]);

  return null;
}
