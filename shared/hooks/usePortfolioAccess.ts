'use client';

import { useEffect, useState } from 'react';

import { PortfolioAccessResponse, portfolioClient } from '@/shared/lib/portfolio-client';

export function usePortfolioAccess() {
  const [access, setAccess] = useState<PortfolioAccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const nextAccess = await portfolioClient.getAccess();
        if (!isMounted) {
          return;
        }

        setAccess(nextAccess);
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
