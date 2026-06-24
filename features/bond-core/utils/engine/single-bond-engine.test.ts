import { describe, expect, it } from 'vitest';
import { BOND_DEFINITIONS } from '../../constants/bond-definitions';
import { BondInputs, BondType, TaxStrategy } from '../../types';
import { SimulationEventType } from '../../types/simulation';
import { calculateBondInvestment } from './single-bond-engine';

function singlePayload(overrides: Partial<BondInputs> = {}): BondInputs {
  const definition = BOND_DEFINITIONS[overrides.bondType ?? BondType.EDO];

  return {
    bondType: overrides.bondType ?? BondType.EDO,
    initialInvestment: 10000,
    firstYearRate: definition.firstYearRate,
    expectedInflation: 3.5,
    expectedNbpRate: 5.25,
    margin: definition.margin,
    duration: definition.duration,
    earlyWithdrawalFee: definition.earlyWithdrawalFee,
    taxRate: 19,
    isCapitalized: definition.isCapitalized,
    payoutFrequency: definition.payoutFrequency,
    purchaseDate: '2026-06-16',
    withdrawalDate: '2036-06-16',
    isRebought: false,
    rebuyDiscount: definition.rebuyDiscount,
    taxStrategy: TaxStrategy.STANDARD,
    timingMode: 'exact',
    investmentHorizonMonths: 120,
    ...overrides,
  };
}

function eventTypes(result: ReturnType<typeof calculateBondInvestment>) {
  return result.timeline.flatMap((point) => point.events?.map((event) => event.type) ?? []);
}

describe('single bond cycle engine', () => {
  it('keeps the terminal point as a withdrawal checkpoint', () => {
    const result = calculateBondInvestment(singlePayload());
    const finalPoint = result.timeline.at(-1);

    expect(finalPoint?.isWithdrawal).toBe(true);
    expect(finalPoint?.events?.map((event) => event.type)).toContain(
      SimulationEventType.WITHDRAWAL,
    );
    expect(result.netPayoutValue).toBeGreaterThan(10000);
    expect(result.finalRealValue).toBeGreaterThan(0);
  });

  it('records rollover purchases across multiple short bond cycles', () => {
    const definition = BOND_DEFINITIONS[BondType.ROR];
    const result = calculateBondInvestment(
      singlePayload({
        bondType: BondType.ROR,
        firstYearRate: definition.firstYearRate,
        margin: definition.margin,
        duration: definition.duration,
        earlyWithdrawalFee: definition.earlyWithdrawalFee,
        isCapitalized: definition.isCapitalized,
        payoutFrequency: definition.payoutFrequency,
        withdrawalDate: '2028-06-16',
        investmentHorizonMonths: 24,
        rollover: true,
        isRebought: true,
        rebuyDiscount: definition.rebuyDiscount,
      }),
    );

    expect(eventTypes(result)).toContain(SimulationEventType.ROLLOVER_PURCHASE);
    expect(result.timeline.some((point) => point.cycleIndex === 2)).toBe(true);
    expect(result.calculationNotes?.join(' ')).toContain('2 bond cycles');
  });

  it('keeps leftover cash outside whole-bond purchase events', () => {
    const definition = BOND_DEFINITIONS[BondType.ROR];
    const result = calculateBondInvestment(
      singlePayload({
        bondType: BondType.ROR,
        initialInvestment: 150,
        firstYearRate: definition.firstYearRate,
        margin: definition.margin,
        duration: definition.duration,
        earlyWithdrawalFee: definition.earlyWithdrawalFee,
        isCapitalized: definition.isCapitalized,
        payoutFrequency: definition.payoutFrequency,
        withdrawalDate: '2027-06-16',
        investmentHorizonMonths: 12,
      }),
    );
    const purchaseEvent = result.timeline
      .flatMap((point) => point.events ?? [])
      .find(
        (event) =>
          event.type === SimulationEventType.PURCHASE && event.description.includes('bonds'),
      );

    expect(purchaseEvent?.value).toBe(100);
    expect(result.netPayoutValue).toBeGreaterThan(150);
  });

  it('records early redemption fees before native maturity', () => {
    const definition = BOND_DEFINITIONS[BondType.COI];
    const result = calculateBondInvestment(
      singlePayload({
        bondType: BondType.COI,
        firstYearRate: definition.firstYearRate,
        margin: definition.margin,
        duration: definition.duration,
        earlyWithdrawalFee: definition.earlyWithdrawalFee,
        isCapitalized: definition.isCapitalized,
        payoutFrequency: definition.payoutFrequency,
        withdrawalDate: '2027-06-16',
        investmentHorizonMonths: 12,
      }),
    );

    expect(eventTypes(result)).toContain(SimulationEventType.EARLY_REDEMPTION_FEE);
    expect(result.totalEarlyWithdrawalFee).toBeGreaterThan(0);
    expect(result.calculationNotes?.join(' ')).toContain('Early redemption fee');
  });

  it('marks custom CPI reset segments as projected rate data', () => {
    const result = calculateBondInvestment(
      singlePayload({
        customInflation: [3.5, 4.5],
        withdrawalDate: '2028-06-16',
        investmentHorizonMonths: 24,
      }),
    );

    expect(result.dataQualityFlags).toContain('projected_rate_segment');
    expect(result.timeline.some((point) => point.usedProjectedRate)).toBe(true);
    expect(eventTypes(result)).toContain(SimulationEventType.RATE_RESET);
  });

  it('preserves floating-rate source fields and final tax checkpoint', () => {
    const definition = BOND_DEFINITIONS[BondType.ROR];
    const result = calculateBondInvestment(
      singlePayload({
        bondType: BondType.ROR,
        firstYearRate: definition.firstYearRate,
        margin: definition.margin,
        duration: definition.duration,
        earlyWithdrawalFee: definition.earlyWithdrawalFee,
        isCapitalized: definition.isCapitalized,
        payoutFrequency: definition.payoutFrequency,
        withdrawalDate: '2027-06-16',
        investmentHorizonMonths: 12,
        customNbpRate: [5.25],
      }),
    );
    const resetPoint = result.timeline.find((point) => point.rateSource === 'projected_nbp');
    const finalPoint = result.timeline.at(-1);

    expect(resetPoint).toMatchObject({
      rateReferenceValue: 5.25,
      rateMarginApplied: definition.margin,
      usedProjectedRate: true,
    });
    expect(finalPoint?.isWithdrawal).toBe(true);
    expect(finalPoint?.taxDeducted).toBeGreaterThanOrEqual(0);
    expect(finalPoint?.totalValue).toBeCloseTo(result.netPayoutValue, 8);
  });

  it('keeps early-exit checkpoint values below withdrawal value after fee', () => {
    const definition = BOND_DEFINITIONS[BondType.EDO];
    const result = calculateBondInvestment(
      singlePayload({
        bondType: BondType.EDO,
        firstYearRate: definition.firstYearRate,
        margin: definition.margin,
        duration: definition.duration,
        earlyWithdrawalFee: definition.earlyWithdrawalFee,
        isCapitalized: definition.isCapitalized,
        payoutFrequency: definition.payoutFrequency,
        withdrawalDate: '2028-06-16',
        investmentHorizonMonths: 24,
      }),
    );
    const finalPoint = result.timeline.at(-1);

    expect(result.isEarlyWithdrawal).toBe(true);
    expect(result.totalEarlyWithdrawalFee).toBeGreaterThan(0);
    expect(finalPoint?.earlyWithdrawalValue).toBeLessThanOrEqual(finalPoint?.totalValue ?? 0);
    expect(finalPoint?.events?.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        SimulationEventType.EARLY_REDEMPTION_FEE,
        SimulationEventType.WITHDRAWAL,
      ]),
    );
  });
});
