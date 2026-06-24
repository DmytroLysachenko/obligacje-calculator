import { describe, expect, it } from 'vitest';

import { MODEL_VERSION } from '@/features/bond-core/model-version';

import { createHealthPayload } from './service';

describe('health service', () => {
  it('creates the raw liveness payload used by platform checks', () => {
    expect(createHealthPayload(new Date('2026-06-15T12:00:00.000Z'))).toEqual({
      ok: true,
      service: 'obligacje-calculator',
      modelVersion: MODEL_VERSION,
      timestamp: '2026-06-15T12:00:00.000Z',
    });
  });
});
