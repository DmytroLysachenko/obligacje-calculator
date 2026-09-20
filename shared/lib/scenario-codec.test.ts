import { describe, expect, it } from 'vitest';

import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { buildDefaultSharedConfig } from '@/features/comparison-engine/lib/comparison-calculator-state';
import { buildFallbackInputs } from '@/features/single-calculator/lib/single-calculator-state';

import {
  createComparisonScenarioPackage,
  createSingleScenarioPackage,
  decodeScenarioFromUrl,
  encodeScenarioForUrl,
  parseScenarioPackage,
  serializeScenarioPackage,
} from './scenario-codec';

describe('scenario codec', () => {
  it('round-trips complete advanced single-bond assumptions without historical output', () => {
    const inputs = {
      ...buildFallbackInputs(new Date('2026-01-01')),
      bondType: BondType.EDO,
      customInflation: Array.from({ length: 10 }, (_, index) => 2.1 + index),
      customNbpRate: Array.from({ length: 10 }, (_, index) => 5.1 - index / 10),
      taxStrategy: TaxStrategy.IKE,
      historicalData: { '2025-01': { inflation: 3.1 } },
    };
    const scenario = createSingleScenarioPackage(inputs);
    const encoded = encodeScenarioForUrl(scenario);
    expect(encoded).not.toBeNull();
    const decoded = decodeScenarioFromUrl(encoded);
    expect(decoded).toMatchObject({ ok: true, scenario: { kind: 'single-bond' } });
    if (decoded.ok && decoded.scenario.kind === 'single-bond') {
      expect(decoded.scenario.intent).toMatchObject({
        customInflation: inputs.customInflation,
        customNbpRate: inputs.customNbpRate,
        taxStrategy: TaxStrategy.IKE,
      });
      expect(decoded.scenario.intent).not.toHaveProperty('historicalData');
    }
  });

  it('round-trips same-family comparison strategies independently', () => {
    const scenario = createComparisonScenarioPackage({
      mode: 'independent',
      sharedConfig: {
        ...buildDefaultSharedConfig(new Date('2026-01-01')),
        customInflation: Array.from({ length: 10 }, (_, index) => 2 + index),
      },
      scenarioA: { bondType: BondType.EDO, taxStrategy: TaxStrategy.STANDARD, rollover: false },
      scenarioB: { bondType: BondType.EDO, taxStrategy: TaxStrategy.IKE, rollover: true },
    });
    const decoded = parseScenarioPackage(serializeScenarioPackage(scenario));
    expect(decoded).toMatchObject({ ok: true, scenario: { kind: 'bond-comparison' } });
    if (decoded.ok && decoded.scenario.kind === 'bond-comparison') {
      expect(decoded.scenario.intent.scenarioA).not.toEqual(decoded.scenario.intent.scenarioB);
    }
  });

  it('rejects malformed and unsupported package versions explicitly', () => {
    expect(parseScenarioPackage('{')).toEqual({ ok: false, reason: 'malformed' });
    expect(parseScenarioPackage({ version: 99, kind: 'single-bond', intent: {} })).toEqual({
      ok: false,
      reason: 'unsupported-version',
    });
  });
});
