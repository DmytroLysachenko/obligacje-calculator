import { describe, it, expect } from 'vitest';
import { calculateBondInvestment } from './calculations';
import { BondType, InterestPayout } from '../types';

describe('Bond Calculations', () => {
  const baseInputs = {
    initialInvestment: 10000,
    firstYearRate: 6.0,
    expectedInflation: 2.0,
    margin: 1.5,
    duration: 4,
    earlyWithdrawalFee: 2.0,
    taxRate: 19,
    bondType: BondType.COI,
    isCapitalized: false,
    payoutFrequency: InterestPayout.YEARLY,
    purchaseDate: '2024-01-01T00:00:00.000Z',
    withdrawalDate: '2028-01-01T00:00:00.000Z',
    isRebought: false,
    rebuyDiscount: 0.1,
  };

  it('calculates 3-month OTS bond correctly', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.OTS,
      duration: 0.25,
      firstYearRate: 3.0,
      withdrawalDate: '2024-04-01T00:00:00.000Z',
    };
    const results = calculateBondInvestment(inputs);
    
    // 10000 * 3% * (3/12) = 75 gross interest
    // 75 * 19% tax = 14.25 tax
    // Net profit = 75 - 14.25 = 60.75
    expect(results.grossValue).toBeCloseTo(10075, 1);
    expect(results.totalProfit).toBeCloseTo(60.75, 1);
  });

  it('applies early withdrawal fee correctly for COI', () => {
    const inputs = {
      ...baseInputs,
      withdrawalDate: '2025-01-01T00:00:00.000Z', // Withdraw after 1 year (COI is 4y)
    };
    const results = calculateBondInvestment(inputs);
    
    // 100 bonds * 2 PLN fee = 200 PLN fee
    expect(results.isEarlyWithdrawal).toBe(true);
    expect(results.totalEarlyWithdrawalFee).toBe(200);
  });

  it('applies swap discount correctly', () => {
    const inputs = {
      ...baseInputs,
      isRebought: true,
      rebuyDiscount: 0.1, // 99.90 PLN per bond
    };
    const results = calculateBondInvestment(inputs);
    
    // 10000 / 99.90 = 100.1 -> 100 bonds
    // actual investment = 100 * 99.90 = 9990
    // nominal start = 100 * 100 = 10000
    expect(results.netPayoutValue).toBeGreaterThan(10000);
  });

  it('handles capitalization correctly for EDO (10y)', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.EDO,
      duration: 10,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      withdrawalDate: '2034-01-01T00:00:00.000Z',
    };
    const results = calculateBondInvestment(inputs);
    
    // Year 1 interest should be added to base for Year 2
    const firstYear = results.timeline[0];
    const secondYear = results.timeline[1];
    
    expect(secondYear.nominalValueBeforeInterest).toBe(firstYear.nominalValueAfterInterest);
  });
});
