import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('shared/components/results/ScenarioDecisionRail.tsx', 'utf8');
const en = readFileSync('i18n/translations/en.json', 'utf8');

describe('scenario decision rail translations', () => {
  it('uses the simulation namespace containing its decision labels', () => {
    expect(source).toContain("t('bonds.simulation.decision_bond')");
    expect(source).toContain("t('bonds.simulation.decision_horizon')");
    expect(source).toContain("t('bonds.simulation.decision_invested')");
    expect(source).toContain("t('bonds.simulation.decision_summary')");
    expect(source).toContain("t('bonds.simulation.decision_result_link')");
    expect(source).toContain("t('bonds.simulation.decision_details_link')");
  });

  it('does not request non-existent results namespace keys', () => {
    expect(source).not.toContain('bonds.results.decision_');
    expect(en).toContain('"decision_summary": "Decision summary"');
  });
});
