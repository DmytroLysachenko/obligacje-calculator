'use client';

import { useEffect, useState } from 'react';
import { unwrapApiData } from '@/shared/lib/api-response';

type PortfolioAccessResponse = {
  ownerId: string;
  isGuest: boolean;
  authMode: 'authenticated' | 'guest' | 'auth_unavailable_guest_fallback';
  canManageWorkspace: boolean;
};

export function usePortfolioAccess() {
  const [access, setAccess] = useState<PortfolioAccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await fetch('/api/portfolio/access');
        const payload = await response.json().catch(() => null);

        if (!response.ok || !isMounted) {
          return;
        }

        setAccess(unwrapApiData<PortfolioAccessResponse>(payload) ?? null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    access,
    isLoading,
    canManageWorkspace: access?.canManageWorkspace ?? false,
    isGuestWorkspace: access?.isGuest ?? true,
  };
}
