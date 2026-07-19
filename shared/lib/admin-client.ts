import { apiGet, apiPost } from '@/shared/lib/api-client';

export interface AdminSeriesStatus {
  id: string;
  name: string;
  slug: string;
  frequency: string;
  lastDataPointDate: string | null;
  pointCount: number;
  updatedAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
}

export interface AdminBondOfferSyncSummary {
  source: string | null;
  status: string;
  completedAt: string | null;
  message: string;
}

export interface AdminStatusData {
  series: AdminSeriesStatus[];
  systemTime: string;
  env: string;
  latestBondOfferSync: AdminBondOfferSyncSummary | null;
}

export type AdminSyncMode = 'full-sync';

function buildAdminHeaders(secret: string): HeadersInit {
  return {
    Authorization: `Bearer ${secret}`,
  };
}

export const adminClient = {
  getStatus(secret: string) {
    return apiGet<AdminStatusData>('/api/admin/status', {
      headers: buildAdminHeaders(secret),
    });
  },
  runSync(secret: string, mode: AdminSyncMode) {
    return apiPost<unknown>(
      '/api/admin/sync',
      { mode },
      {
        headers: buildAdminHeaders(secret),
      },
    );
  },
};
