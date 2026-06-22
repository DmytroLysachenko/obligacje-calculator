import {MODEL_VERSION} from '@/features/bond-core/model-version';

export interface HealthPayload {
  ok: true;
  service: 'obligacje-calculator';
  modelVersion: string;
  timestamp: string;
}

export function createHealthPayload(now = new Date()): HealthPayload {
  return {
    ok: true,
    service: 'obligacje-calculator',
    modelVersion: MODEL_VERSION,
    timestamp: now.toISOString(),
  };
}
