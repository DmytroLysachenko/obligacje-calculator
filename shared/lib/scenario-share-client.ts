import { apiPost } from '@/shared/lib/api-client';
import { SharedSingleScenarioPayload } from '@/shared/lib/single-scenario-share';

export interface SharedScenarioSnapshot {
  shareId: string;
  shareUrl: string;
}

export const scenarioShareClient = {
  createSingleScenario(payload: SharedSingleScenarioPayload) {
    return apiPost<SharedScenarioSnapshot>('/api/scenarios/share', payload);
  },
};
