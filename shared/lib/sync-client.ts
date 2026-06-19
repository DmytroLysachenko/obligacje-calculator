export interface OpportunisticSyncStatus {
  status: 'cooldown' | 'triggered';
}

export const syncClient = {
  async triggerOpportunisticSync(): Promise<void> {
    await fetch('/api/sync/opportunistic');
  },
};
