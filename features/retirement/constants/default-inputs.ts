import { BondType, TaxStrategy } from '@/features/bond-core/types';

import { RetirementInputs } from '../types/retirement';

export const DEFAULT_RETIREMENT_INPUTS: RetirementInputs = {
  initialCapital: 500000,
  monthlyWithdrawal: 3000,
  expectedInflation: 2.5,
  expectedNbpRate: 5.25,
  bondType: BondType.EDO,
  taxStrategy: TaxStrategy.STANDARD,
  horizonYears: 25,
};
