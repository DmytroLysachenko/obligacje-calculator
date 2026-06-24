import { BondType, TaxStrategy } from '@/features/bond-core/types';

export type RetirementInputs = {
  initialCapital: number;
  monthlyWithdrawal: number;
  expectedInflation: number;
  expectedNbpRate: number;
  bondType: BondType;
  taxStrategy: TaxStrategy;
  horizonYears: number;
};

export type RetirementMetricTone = 'default' | 'success' | 'warning';
