import { describe, expect, it } from 'vitest';

import { buildSharedSingleScenarioPayload } from './single-scenario-share';

describe('client scenario share normalization', () => {
  it('removes historical input before server-side validation', () => {
    const payload = buildSharedSingleScenarioPayload({
      bondType: 'OTS',
      duration: 1,
      historicalData: { '2026': { inflation: 1, nbpRate: 1 } },
    } as never);

    expect(payload.inputs.historicalData).toBeUndefined();
  });
});
