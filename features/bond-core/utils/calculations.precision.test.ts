import { describe, it, expect } from 'vitest';
import { calculateBondInvestment } from './calculations';
import { BondType, TaxStrategy, InterestPayout } from '../types';
import { addYears } from 'date-fns';

describe('Bond Calculation Precision & Edge Cases', () => {
  const purchaseDate = '2024-01-01T00:00:00.000Z';
  const tenYearsLater = addYears(new Date(purchaseDate), 10).toISOString();

  it('matches official rounding for standard EDO 10-year bond (19% tax)', () => {
    // EDO Example: 10000 PLN, 5.6% 1st year, then inflation + margin
    const results = calculateBondInvestment({
      bondType: BondType.EDO,
      initialInvestment: 10000,
      firstYearRate: 5.6,
      expectedInflation: 3.0,
      margin: 2.0,
      duration: 10,
      earlyWithdrawalFee: 3.0,
      taxRate: 19,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      purchaseDate,
      withdrawalDate: tenYearsLater,
      isRebought: false,
      rebuyDiscount: 0,
      taxStrategy: TaxStrategy.STANDARD
    });

    // Check if results are finite and realistic
    expect(results.netPayoutValue).toBeGreaterThan(10000);
    expect(results.totalTax).toBeGreaterThan(0);
    
    // In standard EDO, tax should be exactly 19% of profit
    const grossProfit = results.grossValue - results.initialInvestment;
    const expectedTax = Math.round(grossProfit * 0.19);
    // Official rounding for Belka tax is usually per-bond and rounded to nearest grosz then totaled, 
    // or rounded at the end. Our engine rounds the base then the tax.
    expect(Math.abs(results.totalTax - expectedTax)).toBeLessThan(5); 
  });

  it('calculates 0% tax for IKE strategy', () => {
    const results = calculateBondInvestment({
      bondType: BondType.EDO,
      initialInvestment: 5000,
      firstYearRate: 6.0,
      expectedInflation: 2.0,
      margin: 1.5,
      duration: 10,
      earlyWithdrawalFee: 3.0,
      taxRate: 19,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      purchaseDate,
      withdrawalDate: tenYearsLater,
      isRebought: false,
      rebuyDiscount: 0,
      taxStrategy: TaxStrategy.IKE
    });

    expect(results.totalTax).toBe(0);
    expect(results.netPayoutValue).toBe(results.grossValue);
  });

  it('applies flat 5% tax on FULL amount for IKZE strategy', () => {
    const initialSum = 10000;
    const results = calculateBondInvestment({
      bondType: BondType.COI,
      initialInvestment: initialSum,
      firstYearRate: 5.0,
      expectedInflation: 3.0,
      margin: 1.5,
      duration: 4,
      earlyWithdrawalFee: 0.7,
      taxRate: 19,
      isCapitalized: false,
      payoutFrequency: InterestPayout.YEARLY,
      purchaseDate,
      withdrawalDate: addYears(new Date(purchaseDate), 4).toISOString(),
      isRebought: false,
      rebuyDiscount: 0,
      taxStrategy: TaxStrategy.IKZE
    });

    // IKZE Tax = 5% of (Principal + Total Interest)
    const expectedTax = Math.round(results.grossValue * 0.05);
    expect(results.totalTax).toBe(expectedTax);
    expect(results.netPayoutValue).toBe(results.grossValue - expectedTax);
  });

  it('handles early withdrawal fee caps correctly', () => {
    // OTS has 0 early withdrawal fee usually, but let's test a case where fee > interest
    const results = calculateBondInvestment({
      bondType: BondType.EDO,
      initialInvestment: 100, // 1 bond
      firstYearRate: 1.0, // Very low interest
      expectedInflation: 1.0,
      margin: 1.0,
      duration: 10,
      earlyWithdrawalFee: 3.0, // Fee is 3 PLN
      taxRate: 19,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      purchaseDate,
      withdrawalDate: addMonths(new Date(purchaseDate), 1).toISOString(), // Withdraw after 1 month
      isRebought: false,
      rebuyDiscount: 0,
      taxStrategy: TaxStrategy.STANDARD
    });

    // Interest on 100 PLN at 1% for 1 month is ~0.08 PLN
    // Fee is 3.00 PLN. Official rule: fee cannot exceed interest earned.
    const interestEarned = results.grossValue - 100;
    expect(results.totalEarlyWithdrawalFee).toBeCloseTo(interestEarned, 10);
    expect(results.netPayoutValue).toBeGreaterThanOrEqual(100); 
  });
});

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
