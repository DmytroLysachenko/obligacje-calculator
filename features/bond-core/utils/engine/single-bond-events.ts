import { Decimal } from 'decimal.js';
import { SimulationEvent, SimulationEventType } from '../../types/simulation';

export function createCyclePurchaseEvent({
  cycleIndex,
  date,
  numberOfBonds,
  nominalStartingValue,
}: {
  cycleIndex: number;
  date: Date;
  numberOfBonds: Decimal;
  nominalStartingValue: Decimal;
}): SimulationEvent {
  return {
    type: cycleIndex === 1 ? SimulationEventType.PURCHASE : SimulationEventType.ROLLOVER_PURCHASE,
    date: date.toISOString(),
    description: `${cycleIndex === 1 ? 'Purchase' : 'Rollover purchase'} of ${numberOfBonds} bonds`,
    value: nominalStartingValue.toNumber(),
  };
}

export function createRateResetEvent(date: Date, description: string, value: Decimal): SimulationEvent {
  return {
    type: SimulationEventType.RATE_RESET,
    date: date.toISOString(),
    description,
    value: value.toNumber(),
  };
}

export function createInterestAccrualEvent(date: Date, interestEarned: Decimal): SimulationEvent {
  return {
    type: SimulationEventType.INTEREST_ACCRUAL,
    date: date.toISOString(),
    description: `Accrued interest: ${interestEarned.toFixed(2)} PLN`,
    value: interestEarned.toNumber(),
  };
}

export function createPeriodicTaxSettlementEvent(date: Date, taxDeducted: Decimal): SimulationEvent {
  return {
    type: SimulationEventType.TAX_SETTLEMENT,
    date: date.toISOString(),
    description: `Periodic tax withheld: ${taxDeducted.toFixed(2)} PLN`,
    value: taxDeducted.toNumber(),
  };
}

export function createPayoutEvent(date: Date, payout: Decimal): SimulationEvent {
  return {
    type: SimulationEventType.PAYOUT,
    date: date.toISOString(),
    description: `Periodic interest payout: ${payout.toFixed(2)} PLN`,
    value: payout.toNumber(),
  };
}

export function createEarlyRedemptionFeeEvent(date: Date, fee: Decimal): SimulationEvent {
  return {
    type: SimulationEventType.EARLY_REDEMPTION_FEE,
    date: date.toISOString(),
    description: `Early redemption fee: ${fee.toFixed(2)} PLN`,
    value: fee.toNumber(),
  };
}

export function createFinalTaxSettlementEvent(date: Date, tax: Decimal): SimulationEvent {
  return {
    type: SimulationEventType.TAX_SETTLEMENT,
    date: date.toISOString(),
    description: `Final tax settlement: ${tax.toFixed(2)} PLN`,
    value: tax.toNumber(),
  };
}

export function createMaturityEvent(date: Date): SimulationEvent {
  return {
    type: SimulationEventType.MATURITY,
    date: date.toISOString(),
    description: 'Bond maturity reached',
  };
}

export function createWithdrawalEvent(date: Date, value: Decimal): SimulationEvent {
  return {
    type: SimulationEventType.WITHDRAWAL,
    date: date.toISOString(),
    description: 'Final withdrawal',
    value: value.toNumber(),
  };
}
