import { describe, expect, it } from 'vitest';

import { getCalculationEvidence, getTrustedCalculationEvidence } from './calculation-evidence';
import { ALL_BOND_TYPES } from './support-matrix';
import { BondType } from './types';

describe('calculation evidence', () => {
  it.each(ALL_BOND_TYPES)('records a source and regression suite for %s', (bondType) => {
    const evidence = getCalculationEvidence(bondType);

    expect(evidence.officialRuleReference).toMatch(/^https:\/\//);
    expect(evidence.regressionSuites.length).toBeGreaterThan(0);
  });

  it('keeps family-only bonds out of trusted release evidence', () => {
    expect(getTrustedCalculationEvidence().map(({ bondType }) => bondType)).not.toEqual(
      expect.arrayContaining([BondType.ROS, BondType.ROD]),
    );
  });
});
