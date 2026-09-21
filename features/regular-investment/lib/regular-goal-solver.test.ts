import { describe, expect, it } from 'vitest';

import { solveRequiredRecurringContribution } from './regular-goal-solver';
describe('regular goal solver', () => {
  it('proves the minimal cent contribution meets the target', async () => {
    const result = await solveRequiredRecurringContribution({
      target: 100,
      calculate: async (value) => value * 2,
    });
    expect(result).toMatchObject({ contribution: 50, achieved: 100, reachable: true });
  });
  it('reports bounded unreachable goals honestly', async () =>
    expect(
      await solveRequiredRecurringContribution({
        target: 100,
        maxContribution: 10,
        calculate: async (value) => value,
      }),
    ).toMatchObject({ contribution: null, reachable: false }));
});
