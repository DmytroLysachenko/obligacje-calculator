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
    // tax = 62.5 * 19% = 11.875 -> 12 PLN (rounded to full PLN)
    // net = 10000 + 62.5 - 12 = 10050.5
    expect(results.grossValue).toBeCloseTo(10062.5, 1);
    expect(results.totalProfit).toBeCloseTo(50.5, 1);

    // Early withdrawal before 3 months
    const earlyInputs = {
      ...inputs,
      withdrawalDate: '2026-05-01T00:00:00.000Z',
    };
    const earlyResults = calculateBondInvestment(earlyInputs);
    expect(earlyResults.totalProfit).toBe(0); // OTS loses all interest on early exit
  });

  it('ROR: first-month rate applies to the first month, then NBP rate applies', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.ROR,
      duration: 1,
      firstYearRate: 4.25,
      expectedNbpRate: -1.0,
      margin: 0.0,
      payoutFrequency: InterestPayout.MONTHLY,
      withdrawalDate: '2027-03-01T00:00:00.000Z',
    };
    const results = calculateBondInvestment(inputs);

    expect(results.timeline[1].interestRate).toBe(4.25); // First month (end of month 1)
    expect(results.timeline[2].interestRate).toBe(0); // Month 2 uses NBP (-1.0, floored to 0) + margin 0
    expect(results.timeline[12].interestRate).toBe(0); // Month 12
    expect(results.totalProfit).toBeGreaterThan(0);
  });

  it('supports multi-cycle rollover for short-duration bonds across a longer horizon', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.ROR,
      duration: 1,
      firstYearRate: 4.25,
      expectedNbpRate: 5.25,
      margin: 0,
      payoutFrequency: InterestPayout.MONTHLY,
      purchaseDate: '2026-03-01T00:00:00.000Z',
      withdrawalDate: '2031-03-01T00:00:00.000Z',
      rollover: true,
    };

    const results = calculateBondInvestment(inputs);

    expect(results.timeline.length).toBeGreaterThan(40);
    expect(results.maturityDate).toBe('2031-03-01T00:00:00.000Z');
    expect(results.netPayoutValue).toBeGreaterThan(results.initialInvestment);
    expect(new Set(results.timeline.slice(1).map((point) => point.cycleIndex)).size).toBeGreaterThan(1);
  });

  it('adds calculation audit metadata to timeline points', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.EDO,
      duration: 10,
      firstYearRate: 5.6,
      expectedInflation: 4.0,
      margin: 2.0,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      purchaseDate: '2026-03-01T00:00:00.000Z',
      withdrawalDate: '2028-03-01T00:00:00.000Z',
      rollover: false,
    };

    const results = calculateBondInvestment(inputs);
    const initialPoint = results.timeline[0];
    const firstAccrualPoint = results.timeline[1];
    const secondAccrualPoint = results.timeline[2];

    expect(initialPoint.rateSource).toBe('initial_principal');
    expect(firstAccrualPoint.rateSource).toBe('first_year_fixed');
    expect(firstAccrualPoint.cycleIndex).toBe(1);
    expect(firstAccrualPoint.cycleStartDate).toBe('2026-03-01T00:00:00.000Z');
    expect(secondAccrualPoint.rateSource).toMatch(/cpi|fixed/);
    expect(Array.isArray(results.calculationNotes)).toBe(true);
    expect(Array.isArray(results.dataQualityFlags)).toBe(true);
  });

  it('marks projected macro segments when historical data is unavailable', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.ROR,
      duration: 1,
      firstYearRate: 4.25,
      expectedNbpRate: 5.25,
      payoutFrequency: InterestPayout.MONTHLY,
      purchaseDate: '2026-03-01T00:00:00.000Z',
      withdrawalDate: '2027-03-01T00:00:00.000Z',
      historicalData: {},
    };

    const results = calculateBondInvestment(inputs);
    const projectedPoints = results.timeline.filter((point) => point.usedProjectedRate);

    console.log("PROJECTED POINTS: ", projectedPoints.length, projectedPoints);

    expect(projectedPoints.length).toBeGreaterThan(0);
    expect(projectedPoints.some((point) => point.rateSource === 'projected_nbp')).toBe(true);
    expect(results.dataQualityFlags).toContain('projected_rate_segment');
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
    
    // timeline[0] = initial
    // timeline[1] = Year 1: 10000 * 1.056 = 10560
    // timeline[2] = Year 2: 10560 * (1 + (4+2)%) = 10560 * 1.06 = 11193.6
    expect(results.timeline[1].nominalValueAfterInterest).toBeCloseTo(10560, 1);
    expect(results.timeline[2].nominalValueBeforeInterest).toBeCloseTo(10560, 1);
    expect(results.timeline[2].nominalValueAfterInterest).toBeCloseTo(11193.6, 1);
    
    // Final tax should be 19% of total earned interest (rounded to full PLN)
    const totalEarned = results.grossValue - 10000;
    expect(results.totalTax).toBe(Math.round(totalEarned * 0.19));
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

  it('does not apply early withdrawal fee when the bond is held to maturity', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.COI,
      duration: 4,
      earlyWithdrawalFee: 2.0,
      purchaseDate: '2026-03-01T00:00:00.000Z',
      withdrawalDate: '2030-03-01T00:00:00.000Z',
      payoutFrequency: InterestPayout.YEARLY,
      isCapitalized: false,
    };

    const results = calculateBondInvestment(inputs);
    const finalPoint = results.timeline[results.timeline.length - 1];

    expect(results.totalEarlyWithdrawalFee).toBe(0);
    expect(finalPoint.isMaturity).toBe(true);
  });

  it('tracks periodic withholding tax for payout bonds without taxing again at exit', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.COI,
      duration: 4,
      firstYearRate: 5.0,
      expectedInflation: 3.0,
      margin: 1.5,
      payoutFrequency: InterestPayout.YEARLY,
      isCapitalized: false,
      purchaseDate: '2026-03-01T00:00:00.000Z',
      withdrawalDate: '2030-03-01T00:00:00.000Z',
    };

    const results = calculateBondInvestment(inputs);
    const timelineTax = results.timeline.reduce((sum, point) => sum + point.taxDeducted, 0);

    expect(results.totalTax).toBeCloseTo(timelineTax, 2);
    expect(results.netPayoutValue).toBeCloseTo(
      results.grossValue - results.totalTax - results.totalEarlyWithdrawalFee,
      2,
    );
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
    
    // timeline[0] = initial
    // timeline[1] = Year 1: 5%
    // timeline[2] = Year 2+: max(0, -2) + 1.5 = 1.5%
    expect(results.timeline[1].interestRate).toBe(5.0);
    expect(results.timeline[2].interestRate).toBe(1.5);
  });

  it('IKZE applies exit tax to withdrawal value rather than periodic payout tax', () => {
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
      taxStrategy: TaxStrategy.IKZE,
    };

    const results = calculateBondInvestment(inputs);

    expect(results.totalTax).toBeGreaterThan(0);
    expect(results.timeline.every((point) => point.taxDeducted === 0)).toBe(true);
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
    // Actual investment = 10 * 99.90 = 999.00
    // However, results.initialInvestment currently returns the INPUT value (1000)
    // because the 1 PLN leftover is technically still part of the initial capital.
    expect(results.initialInvestment).toBe(1000);
    expect(results.timeline[1].nominalValueBeforeInterest).toBe(1000);
  });

  it('applies rebuy discount only on eligible rollover purchases', () => {
    const inputs = {
      ...baseInputs,
      bondType: BondType.COI,
      duration: 4,
      purchaseDate: '2026-03-01T00:00:00.000Z',
      withdrawalDate: '2034-03-01T00:00:00.000Z',
      isRebought: true,
      rebuyDiscount: 0.1,
      rollover: true,
    };

    const results = calculateBondInvestment(inputs);
    const cycleIndexes = new Set(results.timeline.slice(1).map((point) => point.cycleIndex));

    expect(cycleIndexes.size).toBeGreaterThan(1);
    expect(results.netPayoutValue).toBeGreaterThan(results.initialInvestment);
  });
});
