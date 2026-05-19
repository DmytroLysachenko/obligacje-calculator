'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  BondType,
  InvestmentFrequency,
  RegularInvestmentInputs,
  TaxStrategy,
} from '../../bond-core/types';
import { RegularInvestmentCalculationEnvelope } from '../../bond-core/types/scenarios';
import { BOND_DEFINITIONS } from '../../bond-core/constants/bond-definitions';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import {
  getHorizonMonths,
  getWithdrawalDateFromMonths,
  toDateString,
} from '@/shared/lib/date-timing';
import { loadPersistedCalculatorState, savePersistedCalculatorState } from '@/shared/lib/calculator-persistence';
import { useBondDefinitions } from '@/shared/hooks/useBondDefinitions';

const DEFAULT_BOND = BondType.EDO;
const DEFAULT_DEFINITION = BOND_DEFINITIONS[DEFAULT_BOND];
const DEFAULT_HORIZON_YEARS = 10;
const DEFAULT_HORIZON_MONTHS = DEFAULT_HORIZON_YEARS * 12;
const STORAGE_KEY = 'obligacje.ladder-calculator.v1';

interface PersistedLadderState {
  inputs: RegularInvestmentInputs;
  envelope: RegularInvestmentCalculationEnvelope | null;
  isDirty: boolean;
}

function buildDefaultInputs(): RegularInvestmentInputs {
  const today = new Date();
  const purchaseDate = toDateString(today);

  return {
    bondType: DEFAULT_BOND,
    contributionAmount: 1000,
    frequency: InvestmentFrequency.MONTHLY,
    investmentHorizonMonths: DEFAULT_HORIZON_MONTHS,
    firstYearRate: DEFAULT_DEFINITION.firstYearRate,
    expectedInflation: 3.5,
    margin: DEFAULT_DEFINITION.margin,
    duration: DEFAULT_DEFINITION.duration,
    earlyWithdrawalFee: DEFAULT_DEFINITION.earlyWithdrawalFee,
    taxRate: 19,
    isCapitalized: DEFAULT_DEFINITION.isCapitalized,
    payoutFrequency: DEFAULT_DEFINITION.payoutFrequency,
    purchaseDate,
    withdrawalDate: getWithdrawalDateFromMonths(
      purchaseDate,
      DEFAULT_HORIZON_MONTHS,
    ),
    isRebought: false,
    rebuyDiscount: DEFAULT_DEFINITION.rebuyDiscount,
    taxStrategy: TaxStrategy.STANDARD,
    timingMode: 'general',
  };
}

function withDerivedDates(
  previous: RegularInvestmentInputs,
  next: RegularInvestmentInputs,
  changedKey: keyof RegularInvestmentInputs,
  changedValue: string | number | boolean | undefined,
) {
  if (changedKey === 'investmentHorizonMonths') {
    const months = Number(changedValue);
    next.investmentHorizonMonths = months;
    next.withdrawalDate = getWithdrawalDateFromMonths(previous.purchaseDate, months);
  }

  if (changedKey === 'purchaseDate') {
    const months =
      previous.investmentHorizonMonths ??
      getHorizonMonths(previous.purchaseDate, previous.withdrawalDate);
    next.withdrawalDate = getWithdrawalDateFromMonths(String(changedValue), months);
  }

  if (changedKey === 'withdrawalDate') {
    const months = getHorizonMonths(previous.purchaseDate, String(changedValue));
    next.investmentHorizonMonths = months;
    next.timingMode = 'exact';
  }

  if (changedKey === 'timingMode' && changedValue === 'general') {
    const months =
      previous.investmentHorizonMonths ??
      getHorizonMonths(previous.purchaseDate, previous.withdrawalDate);
    next.investmentHorizonMonths = months;
    next.withdrawalDate = getWithdrawalDateFromMonths(previous.purchaseDate, months);
  }

  return next;
}

function withBondDefinition(
  previous: RegularInvestmentInputs,
  type: BondType,
  definitions?: Record<BondType, typeof BOND_DEFINITIONS[BondType]> | null,
): RegularInvestmentInputs {
  const definition = definitions?.[type] ?? BOND_DEFINITIONS[type];

  return {
    ...previous,
    bondType: type,
    duration: definition.duration,
    firstYearRate: definition.firstYearRate,
    margin: definition.margin,
    earlyWithdrawalFee: definition.earlyWithdrawalFee,
    isCapitalized: definition.isCapitalized,
    payoutFrequency: definition.payoutFrequency,
    rebuyDiscount: definition.rebuyDiscount,
  };
}

export function useLadder() {
  const { definitions } = useBondDefinitions();
  const [inputs, setInputs] = useState<RegularInvestmentInputs>(
    buildDefaultInputs,
  );
  const [envelope, setEnvelope] =
    useState<RegularInvestmentCalculationEnvelope | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);
  const { isCalculating, post } = useCalculationRequest();
  const hasRestoredState = useRef(false);

  const results = envelope?.result || null;
  const applyDefinitionUpdate = useEffectEvent(
    (definition: typeof BOND_DEFINITIONS[BondType]) => {
      setInputs((previous) => ({
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
      }));
    },
  );

  useEffect(() => {
    if (!definitions || !definitions[inputs.bondType]) {
      return;
    }

    const definition = definitions[inputs.bondType];
    applyDefinitionUpdate(definition);
  }, [definitions, inputs.bondType]);

  useEffect(() => {
    if (hasRestoredState.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const restoredState = loadPersistedCalculatorState<PersistedLadderState>(STORAGE_KEY);
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

  const calculate = useCallback(async () => {
    try {
      const data = await post<RegularInvestmentCalculationEnvelope>(
        '/api/calculate/regular',
        inputs,
        { preferWorker: true },
      );
      setEnvelope(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Ladder calculation error:', error);
    }
  }, [inputs, post]);

  const updateInput = useCallback(
    (
      key: keyof RegularInvestmentInputs,
      value: string | number | boolean | undefined,
    ) => {
      setIsDirty(true);
      setInputs((previous) =>
        withDerivedDates(previous, { ...previous, [key]: value }, key, value),
      );
    },
    [],
  );

  const setBondType = useCallback((type: BondType) => {
    setIsDirty(true);
    setInputs((previous) => withBondDefinition(previous, type, definitions));
  }, [definitions]);

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

  return {
    inputs,
    results,
    envelope,
    warnings: envelope?.warnings || [],
    assumptions: envelope?.assumptions || [],
    dataFreshness: envelope?.dataFreshness,
    isDirty,
    isCalculating,
    calculate,
    updateInput,
    setBondType,
    definitions: definitions ?? BOND_DEFINITIONS,
    isPersistenceReady,
  };
}
