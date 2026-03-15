import { describe, it, expect } from 'vitest';
import { calculateBondInvestment } from './calculations';
import { BondType, InterestPayout, TaxStrategy } from '../types';

describe('Comprehensive Bond Calculations', () => {
  const baseInputs = {
    initialInvestment: 10000,
    firstYearRate: 5.0,
    expectedInflation: 3.0,
    expectedNbpRate: 5.0,
    margin: 1.5,
    duration: 4,
    earlyWithdrawalFee: 2.0,
    taxRate: 19,
    bondType: BondType.COI,
    isCapitalized: false,
    payoutFrequency: InterestPayout.YEARLY,
    purchaseDate: '2026-03-01T00:00:00.000Z',
    withdrawalDate: '2030-03-01T00:00:00.000Z',
    isRebought: false,
    rebuyDiscount: 0.1,
    taxStrategy: TaxStrategy.STANDARD,
  };

  it('OTS: 3-month fixed rate, no early interest', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.OTS,
      duration: 0.25,
      firstYearRate: 2.5,
      withdrawalDate: '2026-06-01T00:00:00.000Z',
    };
    const results = calculateBondInvestment(inputs);
    
    // 100 bonds * 100 PLN = 10000
    // interest = 10000 * 2.5% * (3/12) = 62.5 PLN gross
    // tax = 62.5 * 19% = 11.875 -> 11.88 PLN
    // net = 10000 + 62.5 - 11.88 = 10050.62
    expect(results.grossValue).toBeCloseTo(10062.5, 1);
    expect(results.totalProfit).toBeCloseTo(50.625, 1);

    // Early withdrawal before 3 months
    const earlyInputs = {
      ...inputs,
      withdrawalDate: '2026-05-01T00:00:00.000Z',
    };
    const earlyResults = calculateBondInvestment(earlyInputs);
    expect(earlyResults.totalProfit).toBe(0); // OTS loses all interest on early exit
  });

  it('ROR: 1-year variable, monthly payout, NBP floor', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.ROR,
      duration: 1,
      firstYearRate: 4.25,
      expectedNbpRate: -1.0, // Test NBP floor
      margin: 0.0,
      payoutFrequency: InterestPayout.MONTHLY,
      withdrawalDate: '2027-03-01T00:00:00.000Z',
    };
    const results = calculateBondInvestment(inputs);
    
    // Month 1: 4.25% / 12 * 10000 = 35.42 PLN
    // Months 2-12: max(0, -1.0) + 0.0 = 0% interest
    expect(results.timeline[0].interestRate).toBe(4.25);
    expect(results.timeline[1].interestRate).toBe(0);
    expect(results.totalProfit).toBeCloseTo(35.42 * 0.81, 1);
  });

  it('EDO: 10-year inflation-indexed, capitalization, tax at end', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.EDO,
      duration: 10,
      firstYearRate: 5.6,
      expectedInflation: 4.0,
      margin: 2.0,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      withdrawalDate: '2036-03-01T00:00:00.000Z',
    };
    const results = calculateBondInvestment(inputs);
    
    // Year 1: 10000 * 1.056 = 10560
    // Year 2: 10560 * (1 + (4+2)%) = 10560 * 1.06 = 11193.6
    expect(results.timeline[0].nominalValueAfterInterest).toBeCloseTo(10560, 1);
    expect(results.timeline[1].nominalValueBeforeInterest).toBeCloseTo(10560, 1);
    expect(results.timeline[1].nominalValueAfterInterest).toBeCloseTo(11193.6, 1);
    
    // Final tax should be 19% of total earned interest
    const totalEarned = results.grossValue - 10000;
    expect(results.totalTax).toBeCloseTo(totalEarned * 0.19, 1);
  });

  it('Early withdrawal fee protection: investor never gets less than nominal', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.EDO,
      duration: 10,
      earlyWithdrawalFee: 3.0,
      withdrawalDate: '2026-04-01T00:00:00.000Z', // Withdraw very soon (1 month)
    };
    const results = calculateBondInvestment(inputs);
    
    // 1 month interest: 10000 * 5.0% * (31 / 365) = 42.4657... PLN
    // Max fee: 100 bonds * 3.0 = 300 PLN
    // Fee should be capped at interest earned (42.47)
    expect(results.totalEarlyWithdrawalFee).toBeCloseTo(42.47, 1);
    expect(results.netPayoutValue).toBeGreaterThanOrEqual(10000);
  });

  it('Deflation: inflation floor of 0% applied to indexed bonds', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.COI,
      duration: 4,
      firstYearRate: 5.0,
      expectedInflation: -2.0, // Deflation
      margin: 1.5,
      withdrawalDate: '2030-03-01T00:00:00.000Z',
    };
    const results = calculateBondInvestment(inputs);
    
    // Year 1: 5%
    // Year 2+: max(0, -2) + 1.5 = 1.5%
    expect(results.timeline[0].interestRate).toBe(5.0);
    expect(results.timeline[1].interestRate).toBe(1.5);
  });

  it('Swap discount: calculates initial investment and units correctly', () => {
    const inputs = {
      ...baseInputs,
      initialInvestment: 1000,
      isRebought: true,
      rebuyDiscount: 0.1, // Price = 99.90
    };
    const results = calculateBondInvestment(inputs);
    
    // 1000 / 99.90 = 10.01 -> 10 bonds
    // Initial investment = 10 * 99.90 = 999.00
    // Nominal starting = 10 * 100 = 1000
    expect(results.initialInvestment).toBe(999);
    expect(results.timeline[0].nominalValueBeforeInterest).toBe(1000);
  });
});
