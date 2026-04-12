import { describe, it, expect } from 'vitest';
import { calculateBondInvestment } from './calculations';
import { BondType, InterestPayout, TaxStrategy } from '../types';
import { addYears } from 'date-fns';

describe('Bond Calculation Edge Cases: Inflation Extremes', () => {
  const purchaseDate = '2024-01-01T00:00:00.000Z';
  const tenYearsLater = addYears(new Date(purchaseDate), 10).toISOString();

  it('handles hyperinflation scenarios (e.g. 100% inflation)', () => {
    const results = calculateBondInvestment({
      bondType: BondType.EDO,
      initialInvestment: 10000,
      firstYearRate: 7.5,
      expectedInflation: 100.0, // 100% inflation
      margin: 1.5,
      duration: 10,
      earlyWithdrawalFee: 2.0,
      taxRate: 19,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      purchaseDate,
      withdrawalDate: tenYearsLater,
      isRebought: false,
      rebuyDiscount: 0,
      taxStrategy: TaxStrategy.STANDARD
    });

    // Nominal value should explode
    expect(results.grossValue).toBeGreaterThan(1000000); 
    // Real value should drop because firstYearRate (7.5%) is much lower than inflation (100%)
    expect(results.finalRealValue).toBeLessThan(10000);
    expect(results.finalRealValue).toBeGreaterThan(100);
  });

  it('handles deflation scenarios (e.g. -5% inflation)', () => {
    const results = calculateBondInvestment({
      bondType: BondType.EDO,
      initialInvestment: 10000,
      firstYearRate: 7.5,
      expectedInflation: -5.0, // Deflation
      margin: 1.5,
      duration: 10,
      earlyWithdrawalFee: 2.0,
      taxRate: 19,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      purchaseDate,
      withdrawalDate: tenYearsLater,
      isRebought: false,
      rebuyDiscount: 0,
      taxStrategy: TaxStrategy.STANDARD
    });

    // In Polish bonds, if inflation + margin < 0, interest rate is usually capped at 0 or margin.
    // Official rule for COI/EDO: interest rate = inflation + margin, but not less than 0?
    // Actually, usually it's just inflation + margin. If it's negative, nominal value could decrease?
    // NO, nominal value of treasury bonds cannot decrease. Interest rate is floored at 0%.
    
    // Check if interest rate in year 2+ is at least 0
    results.timeline.slice(1).forEach(point => {
      expect(point.interestRate).toBeGreaterThanOrEqual(0);
    });

    expect(results.grossValue).toBeGreaterThanOrEqual(10000);
  });

  it('handles zero interest rate scenario', () => {
    const results = calculateBondInvestment({
      bondType: BondType.EDO,
      initialInvestment: 10000,
      firstYearRate: 0,
      expectedInflation: -10.0,
      margin: 0,
      duration: 10,
      earlyWithdrawalFee: 2.0,
      taxRate: 19,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      purchaseDate,
      withdrawalDate: tenYearsLater,
      isRebought: false,
      rebuyDiscount: 0,
      taxStrategy: TaxStrategy.STANDARD
    });

    expect(results.grossValue).toBe(10000);
    expect(results.totalProfit).toBe(0);
  });
});
