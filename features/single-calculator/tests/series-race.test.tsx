import { act, renderHook } from '@testing-library/react';
import type { Dispatch, SetStateAction } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';
import { buildFallbackInputs } from '@/features/single-calculator/lib/single-calculator-state';
import type { BondSeriesMetadata } from '@/shared/lib/bond-series-client';

const fetchSeriesForSymbol = vi.hoisted(() => vi.fn());

vi.mock('@/features/single-calculator/lib/single-calculator-actions', () => ({
  fetchBondSeriesForSymbol: fetchSeriesForSymbol,
}));

import { useBondCalculatorEffects } from '../hooks/useBondCalculatorEffects';

const falseRef = () => ({ current: false });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

function renderEffects(
  bondType: BondType,
  setAvailableSeries: Dispatch<SetStateAction<BondSeriesMetadata[]>>,
) {
  const inputs = { ...buildFallbackInputs(), bondType };
  return renderHook(
    ({ currentBondType }) =>
      useBondCalculatorEffects({
        session: {
          inputs: { ...inputs, bondType: currentBondType },
          envelope: null,
          selectedSeriesId: null,
          lastCommittedInputs: null,
          isDirty: false,
          isCalculating: false,
          isPersistenceReady: true,
        },
        actions: {
          setInputs: vi.fn(),
          setEnvelope: vi.fn(),
          setSelectedSeriesId: vi.fn(),
          setLastCommittedInputs: vi.fn(),
          setIsDirty: vi.fn(),
          setIsPersistenceReady: vi.fn(),
          setAvailableSeries,
        },
        initialInputs: inputs,
        fallbackInputs: inputs,
        definitions: BOND_DEFINITIONS,
        macroDefaults: null,
        calculate: vi.fn(),
        hasRestoredStateRef: falseRef(),
        hasAutoCalculatedSharedScenarioRef: falseRef(),
        restoredFromPersistenceRef: falseRef(),
        hasTouchedMacroAssumptionsRef: falseRef(),
      }),
    { initialProps: { currentBondType: bondType } },
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('ignores an obsolete bond-series response after bond type changes', async () => {
  const edo = deferred<[]>();
  const coi = deferred<[]>();
  fetchSeriesForSymbol.mockImplementation((bondType: BondType) =>
    bondType === BondType.EDO ? edo.promise : coi.promise,
  );
  const setAvailableSeries = vi.fn() as Dispatch<SetStateAction<BondSeriesMetadata[]>>;
  const hook = renderEffects(BondType.EDO, setAvailableSeries);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(fetchSeriesForSymbol).toHaveBeenCalledWith(BondType.EDO);
  hook.rerender({ currentBondType: BondType.COI });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(fetchSeriesForSymbol).toHaveBeenCalledWith(BondType.COI);
  await act(async () => {
    edo.resolve([]);
    await Promise.resolve();
    coi.resolve([]);
    await Promise.resolve();
  });

  expect(setAvailableSeries).toHaveBeenCalledTimes(1);
});
