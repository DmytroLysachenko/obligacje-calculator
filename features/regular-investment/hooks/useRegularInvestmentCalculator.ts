import { useState, useCallback, useEffect, useRef } from 'react';
import { RegularInvestmentInputs, BondType, InvestmentFrequency, TaxStrategy, InterestPayout } from '../../bond-core/types';
import { RegularInvestmentCalculationEnvelope } from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { getHorizonMonths, getWithdrawalDateFromMonths, toDateString } from '@/shared/lib/date-timing';
import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';
import { loadPersistedCalculatorState, savePersistedCalculatorState } from '@/shared/lib/calculator-persistence';

const DEFAULT_BOND = BondType.EDO;
const STORAGE_KEY = 'obligacje.regular-calculator.v1';
const defaultHorizonYears = 10;
const defaultHorizonMonths = defaultHorizonYears * 12;
function buildFallbackInputs(): RegularInvestmentInputs {
  const purchaseDate = toDateString(new Date());

  return {
    bondType: DEFAULT_BOND,
    contributionAmount: 1000,
    frequency: InvestmentFrequency.MONTHLY,
    investmentHorizonMonths: defaultHorizonMonths,
    firstYearRate: 5.35,
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    margin: 2.0,
    duration: 10,
    earlyWithdrawalFee: 2.0,
    taxRate: 19,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    purchaseDate,
    withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, defaultHorizonMonths),
    isRebought: false,
    rebuyDiscount: 0,
    taxStrategy: TaxStrategy.STANDARD,
    timingMode: 'general',
  };
}

interface PersistedRegularCalculatorState {
  inputs: RegularInvestmentInputs;
  envelope: RegularInvestmentCalculationEnvelope | null;
  isDirty: boolean;
}

function applyDefinitionToInputs(
  previous: RegularInvestmentInputs,
  definition: typeof BOND_DEFINITIONS[BondType],
): RegularInvestmentInputs {
  return {
    ...previous,
    firstYearRate: definition.firstYearRate,
    margin: definition.margin,
    duration: definition.duration,
    earlyWithdrawalFee: definition.earlyWithdrawalFee,
    isCapitalized: definition.isCapitalized,
    payoutFrequency: definition.payoutFrequency,
    rebuyDiscount: definition.rebuyDiscount,
    nominalValue: definition.nominalValue,
    isInflationIndexed: definition.isInflationIndexed,
  };
}

export function useRegularInvestmentCalculator() {
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const fallbackInputs = buildFallbackInputs();
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(
    fallbackInputs,
  );
  const [envelope, setEnvelope] = useState<RegularInvestmentCalculationEnvelope | null>(
    null,
  );
  const [isDirty, setIsDirty] = useState(true);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);
  const { isCalculating, isError, clearError, post } = useCalculationRequest();
  const hasRestoredState = useRef(false);

  useEffect(() => {
    if (!definitions || !definitions[inputs.bondType]) {
      return;
    }

    const definition = definitions[inputs.bondType];
    const timer = window.setTimeout(() => {
      setInputs((previous) => {
        const next = applyDefinitionToInputs(previous, definition);
        return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [definitions, inputs.bondType]);

  useEffect(() => {
    if (hasRestoredState.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const restoredState =
        loadPersistedCalculatorState<PersistedRegularCalculatorState>(STORAGE_KEY);
      hasRestoredState.current = true;

      if (restoredState) {
        setInputs(restoredState.inputs);
        setEnvelope(restoredState.envelope ?? null);
        setIsDirty(restoredState.isDirty ?? true);
      }

      setIsPersistenceReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const results = envelope?.result || null;

  const calculate = useCallback(async (currentInputs = inputs) => {
    setIsDirty(false);
    try {
      clearError();
      const data = await post<RegularInvestmentCalculationEnvelope>('/api/calculate/regular', currentInputs, { preferWorker: true });
      setEnvelope(data);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }, [clearError, inputs, post]);

  useEffect(() => {
    if (!isPersistenceReady) {
      return;
    }

    savePersistedCalculatorState(STORAGE_KEY, {
      inputs,
      envelope,
      isDirty,
    });
  }, [envelope, inputs, isDirty, isPersistenceReady]);

  const updateInput = (key: keyof RegularInvestmentInputs, value: string | number | boolean | undefined) => {
    setIsDirty(true);
    setInputs((prev) => {
      const newInputs = { ...prev, [key]: value };

      if (key === 'investmentHorizonMonths') {
        const months = Number(value);
        newInputs.investmentHorizonMonths = months;
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, months);
      }

      if (key === 'purchaseDate') {
        const months = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(String(value), months);
      }

      if (key === 'withdrawalDate') {
        const months = getHorizonMonths(prev.purchaseDate, String(value));
        newInputs.investmentHorizonMonths = months;
        newInputs.timingMode = 'exact';
      }

      if (key === 'timingMode' && value === 'general') {
        const months = prev.investmentHorizonMonths ?? getHorizonMonths(prev.purchaseDate, prev.withdrawalDate);
        newInputs.investmentHorizonMonths = months;
        newInputs.withdrawalDate = getWithdrawalDateFromMonths(prev.purchaseDate, months);
      }
      
      return newInputs;
    });
  };

  const setBondType = (type: BondType) => {
    if (!definitions) return;
    setIsDirty(true);
    const def = definitions[type];
    setInputs((prev) => ({
      ...prev,
      bondType: type,
      duration: def.duration,
      firstYearRate: def.firstYearRate,
      margin: def.margin,
      earlyWithdrawalFee: def.earlyWithdrawalFee,
      isCapitalized: def.isCapitalized,
      payoutFrequency: def.payoutFrequency,
      rebuyDiscount: def.rebuyDiscount,
      isRebought: false,
      nominalValue: def.nominalValue,
      isInflationIndexed: def.isInflationIndexed,
    }));
  };

  return {
    inputs,
    results,
    envelope,
    warnings: envelope?.warnings || [],
    assumptions: envelope?.assumptions || [],
    dataFreshness: envelope?.dataFreshness,
    isCalculating,
    isError,
    isDirty,
    calculate,
    updateInput,
    setBondType,
    definitions,
    isLoadingDefs,
    isPersistenceReady,
  };
}
