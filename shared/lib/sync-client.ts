import { apiGet } from '@/shared/lib/api-client';

export interface OpportunisticSyncStatus {
  status: 'cooldown' | 'triggered';
}

export const syncClient = {
  async triggerOpportunisticSync(): Promise<OpportunisticSyncStatus> {
    return apiGet<OpportunisticSyncStatus>('/api/sync/opportunistic');
  },
};
