import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import { calculatePeriodAccrual } from './accrual';
import { calculateTaxAmount } from './tax-settlement';
import { BondType, InterestPayout, TaxStrategy } from '../../types';

describe('Bond Engine - Production Accuracy', () => {
  describe('Interest Accrual', () => {
    it('should calculate OTS (3-month) interest correctly (fixed 1/4 year)', () => {
      const principal = new Decimal(100);
      const rate = new Decimal(3.0); // 3%
      const result = calculatePeriodAccrual(principal, rate, 90, 90, BondType.OTS, InterestPayout.MATURITY);
      // 100 * 0.03 * 3/12 = 0.75
      expect(result.interestEarned.toNumber()).toBe(0.75);
    });

    it('should calculate ROR (1-year) monthly payout exactly as rate/12', () => {
      const principal = new Decimal(100);
      const rate = new Decimal(6.0); // 6%
      const result = calculatePeriodAccrual(principal, rate, 31, 31, BondType.ROR, InterestPayout.MONTHLY);
      // 100 * 0.06 / 12 = 0.50
      expect(result.interestEarned.toNumber()).toBe(0.50);
    });

    it('should handle partial months for ROR with Act/365 convention', () => {
      const principal = new Decimal(100);
      const rate = new Decimal(6.0); // 6%
      const result = calculatePeriodAccrual(principal, rate, 15, 31, BondType.ROR, InterestPayout.MONTHLY);
      // 100 * 0.06 * 15/365 = 0.2465753424657534
      expect(result.interestEarned.toFixed(4)).toBe('0.2466');
    });
  });

  describe('Tax Settlement (Official Rounding)', () => {
    it('should round Belka tax base and amount to full PLN (Tax Ordinance Rules)', () => {
      // Base: 10.49 PLN -> 10 PLN base -> 1.90 tax -> 2 PLN tax
      // Base: 10.51 PLN -> 11 PLN base -> 2.09 tax -> 2 PLN tax
      
      const tax1 = calculateTaxAmount(new Decimal(10.49), TaxStrategy.STANDARD, true);
      expect(tax1.toNumber()).toBe(2); // 10 * 0.19 = 1.9 -> 2

      const tax2 = calculateTaxAmount(new Decimal(10.51), TaxStrategy.STANDARD, true);
      expect(tax2.toNumber()).toBe(2); // 11 * 0.19 = 2.09 -> 2
      
      const tax3 = calculateTaxAmount(new Decimal(15.00), TaxStrategy.STANDARD, true);
      expect(tax3.toNumber()).toBe(3); // 15 * 0.19 = 2.85 -> 3
    });

    it('should calculate IKZE 10% flat tax on whole amount with official rounding', () => {
      // 1000 PLN payout -> 100 PLN tax (10%)
      const tax = calculateTaxAmount(new Decimal(1000), TaxStrategy.IKZE, true);
      expect(tax.toNumber()).toBe(100);
    });
  });
});
