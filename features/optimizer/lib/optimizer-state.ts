import { TaxStrategy } from '@/features/bond-core/types';
import { toDateString } from '@/shared/lib/date-timing';

export type OptimizerInputs = {
  initialInvestment: number;
  investmentHorizonMonths: number;
  purchaseDate: string;
  expectedInflation: number;
  expectedNbpRate: number;
  taxStrategy: TaxStrategy;
  includeFamilyBonds: boolean;
};

export type OptimizerInputKey = keyof OptimizerInputs;

export interface OptimizerMacroDefaults {
  expectedInflation: number;
  expectedNbpRate: number;
}

export const OPTIMIZER_MACRO_KEYS = new Set<OptimizerInputKey>([
  'expectedInflation',
  'expectedNbpRate',
]);

export function buildDefaultOptimizerInputs(now = new Date()): OptimizerInputs {
  return {
    initialInvestment: 10000,
    investmentHorizonMonths: 48,
    purchaseDate: toDateString(now),
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    taxStrategy: TaxStrategy.STANDARD,
    includeFamilyBonds: false,
  };
}

export function applyOptimizerMacroDefaults(
  inputs: OptimizerInputs,
  defaults: OptimizerMacroDefaults | null | undefined,
  hasTouchedMacroAssumptions: boolean,
): OptimizerInputs {
  if (!defaults || hasTouchedMacroAssumptions) {
    return inputs;
  }

  return {
    ...inputs,
    expectedInflation: defaults.expectedInflation,
    expectedNbpRate: defaults.expectedNbpRate,
  };
}

export function updateOptimizerInput(
  inputs: OptimizerInputs,
  key: OptimizerInputKey,
  value: string | number | boolean,
) {
  return {
    ...inputs,
    [key]: value,
  };
}

export function isOptimizerMacroKey(key: OptimizerInputKey) {
  return OPTIMIZER_MACRO_KEYS.has(key);
}

export function formatOptimizerHorizonYears(investmentHorizonMonths: number) {
  return (investmentHorizonMonths / 12).toFixed(1);
}

export function buildOptimizerReadySteps({
  amount,
  months,
  labels,
}: {
  amount: string;
  months: number;
  labels: {
    amountTitle: string;
    amountDescription: (amount: string) => string;
    horizonTitle: string;
    horizonDescription: (months: string) => string;
    scopeTitle: string;
    scopeDescription: string;
  };
}) {
  return [
    {
      id: 'amount',
      title: labels.amountTitle,
      description: labels.amountDescription(amount),
    },
    {
      id: 'horizon',
      title: labels.horizonTitle,
      description: labels.horizonDescription(String(months)),
    },
    {
      id: 'narrow-scope',
      title: labels.scopeTitle,
      description: labels.scopeDescription,
    },
  ];
}
