import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { BondInputs, BondType } from '@/features/bond-core/types';

import { getComparisonOfferStatus } from '../lib/comparison-offer-status';

const comparisonHook = readFileSync('features/comparison-engine/hooks/useComparison.ts', 'utf8');
const singleHook = readFileSync('features/single-calculator/hooks/useBondCalculator.ts', 'utf8');
const singleEffects = readFileSync(
  'features/single-calculator/hooks/useBondCalculatorEffects.ts',
  'utf8',
);
const panels = readFileSync(
  'features/comparison-engine/components/ComparisonContainerPanels.tsx',
  'utf8',
);

const inputs = {
  bondType: BondType.EDO,
  firstYearRate: 5.5,
  margin: 2,
  earlyWithdrawalFee: 2,
} as BondInputs;
const envelope = { result: {} } as never;

describe('single and comparison session regressions', () => {
  it('keeps normal single edits separate from calculation callback', () => {
    expect(singleHook).toContain('const calculate = useCallback(');
    expect(singleHook).toContain('calculate: () => calculate(inputs)');
    expect(singleHook).toContain('setIsDirty(true)');
    expect(singleHook).not.toContain('useEffect(() => calculate(inputs)');
  });

  it('allows shared URL input to remain sole automatic single calculation', () => {
    expect(singleEffects).toContain(
      'if (!initialInputs || hasAutoCalculatedSharedScenarioRef.current || isCalculating)',
    );
    expect(singleEffects).toContain('void calculate(initialInputs)');
    expect(singleEffects).toContain('if (initialInputs || !isPersistenceReady)');
  });

  it('keeps URL initialization, series lookup, and local persistence feature-local', () => {
    expect(singleEffects).toContain('fetchBondSeriesForSymbol');
    expect(singleEffects).toContain('SINGLE_CALCULATOR_STORAGE_KEY');
    expect(comparisonHook).toContain('useComparisonPersistenceEffects');
    expect(comparisonHook).toContain('initialUrlState');
  });

  it('reports current offer independently for scenario A', () => {
    expect(
      getComparisonOfferStatus({ inputs, committedInputs: inputs, envelope }).isCurrentOffer,
    ).toBe(true);
  });

  it('reports changed current offer independently for scenario B', () => {
    expect(
      getComparisonOfferStatus({
        inputs: { ...inputs, firstYearRate: 6 },
        committedInputs: inputs,
        envelope,
      }).isCurrentOffer,
    ).toBe(false);
  });

  it('does not show offer disclosure before a calculation commits', () => {
    expect(
      getComparisonOfferStatus({ inputs, committedInputs: null, envelope: null }).message,
    ).toBeNull();
  });

  it('keeps comparison result commit explicit', () => {
    expect(comparisonHook).toContain('const calculate = useCallback(async () =>');
    expect(comparisonHook).toContain('setCommittedInputsA(inputsA)');
    expect(comparisonHook).toContain('setCommittedInputsB(inputsB)');
  });

  it('renders scenario-level offer disclosure accessibly', () => {
    expect(panels).toContain('offerStatusA?: ComparisonOfferStatus');
    expect(panels).toContain('offerStatusB?: ComparisonOfferStatus');
    expect(panels).toContain('entry.offerStatus?.message');
    expect(panels).toContain('role="status"');
  });
});
