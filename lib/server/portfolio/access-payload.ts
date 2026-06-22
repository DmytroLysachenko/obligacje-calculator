import type { PortfolioOwnerContext } from './access';

export interface PortfolioAccessPayload {
  data: {
    ownerId: string;
    isGuest: boolean;
    authMode: PortfolioOwnerContext['authMode'];
    canManageWorkspace: boolean;
  };
}

export function createPortfolioAccessPayload(owner: PortfolioOwnerContext): PortfolioAccessPayload {
  return {
    data: {
      ownerId: owner.ownerId,
      isGuest: owner.isGuest,
      authMode: owner.authMode,
      canManageWorkspace: !owner.isGuest && owner.authMode === 'authenticated',
    },
  };
}
