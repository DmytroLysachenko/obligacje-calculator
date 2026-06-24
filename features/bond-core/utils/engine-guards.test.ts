import { describe, expect, it } from 'vitest';
import { CalculationDomainError } from '../errors';
import { assertCalculationResultIntegrity, sanitizeInputs, withMathGuard } from './engine-guards';

function validSingleResult(overrides: Record<string, unknown> = {}) {
  return {
    initialInvestment: 10000,
    timeline: [
      {
        year: 0,
        periodLabel: 'Start',
        cycleIndex: 0,
        cycleStartDate: '2026-05-30T00:00:00.000Z',
        cycleEndDate: '2026-05-30T00:00:00.000Z',
        interestRate: 0,
        rateSource: 'initial_principal',
        usedProjectedRate: false,
        nominalValueBeforeInterest: 10000,
        interestEarned: 0,
        taxDeducted: 0,
        netInterest: 0,
        nominalValueAfterInterest: 10000,
        accumulatedNetInterest: 0,
        totalValue: 10000,
        realValue: 10000,
        netProfit: 0,
        earlyWithdrawalValue: 10000,
        cumulativeInflation: 1,
        isMaturity: false,
        isWithdrawal: false,
      },
    ],
    finalNominalValue: 10000,
    finalRealValue: 10000,
    totalProfit: 0,
    totalTax: 0,
    totalEarlyWithdrawalFee: 0,
    grossValue: 10000,
    netPayoutValue: 10000,
    isEarlyWithdrawal: false,
    maturityDate: '2026-05-30T00:00:00.000Z',
    nominalAnnualizedReturn: 0,
    realAnnualizedReturn: 0,
    ...overrides,
  };
}

describe('engine math guard', () => {
  it('keeps sanitization deterministic for supported input fields', () => {
    const sanitized = sanitizeInputs({
      firstYearRate: 200,
      margin: -50,
      initialInvestment: Number.NaN,
      contributionAmount: Number.POSITIVE_INFINITY,
      expectedInflation: 1000,
      expectedNbpRate: -50,
      taxRate: undefined,
    });

    expect(sanitized.firstYearRate).toBe(100);
    expect(sanitized.margin).toBe(-5);
    expect(sanitized.initialInvestment).toBe(0);
    expect(sanitized.contributionAmount).toBe(10_000_000);
    expect(sanitized.expectedInflation).toBe(500);
    expect(sanitized.expectedNbpRate).toBe(-5);
  });

  it('accepts finite calculation results with non-empty timelines', () => {
    expect(() => assertCalculationResultIntegrity(validSingleResult())).not.toThrow();
  });

  it('rejects NaN top-level result fields', () => {
    expect(() =>
      assertCalculationResultIntegrity(validSingleResult({ totalProfit: Number.NaN })),
    ).toThrow(CalculationDomainError);
  });

  it('rejects Infinity nested inside timeline rows', () => {
    const result = validSingleResult({
      timeline: [
        {
          ...validSingleResult().timeline[0],
          totalValue: Number.POSITIVE_INFINITY,
        },
      ],
    });

    expect(() => assertCalculationResultIntegrity(result)).toThrow(/Unsafe numeric value detected/);
  });

  it('rejects empty timelines instead of allowing fake success payloads', () => {
    expect(() => assertCalculationResultIntegrity(validSingleResult({ timeline: [] }))).toThrow(
      /empty timeline/,
    );
  });

  it('wraps engine exceptions as calculation domain errors', () => {
    const guarded = withMathGuard(() => {
      throw new Error('raw engine failure');
    });

    expect(() => guarded({})).toThrow(CalculationDomainError);
    expect(() => guarded({})).toThrow(/trustworthy result/);
  });

  it('preserves numeric-fault domain errors without double wrapping', () => {
    const guarded = withMathGuard(() =>
      validSingleResult({ finalNominalValue: Number.POSITIVE_INFINITY }),
    );

    try {
      guarded({});
      throw new Error('expected guard to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationDomainError);
      expect((error as CalculationDomainError).code).toBe('CALCULATION_NUMERIC_FAULT');
    }
  });

  it('never returns the old mathWarning fallback shape', () => {
    const guarded = withMathGuard(() => ({
      totalInvested: 1000,
      finalNominalValue: Number.NaN,
      finalRealValue: 1000,
      totalProfit: 0,
      totalTax: 0,
      totalEarlyWithdrawalFees: 0,
      realAnnualizedReturn: 0,
      timeline: [],
      lots: [],
    }));

    expect(() => guarded({ contributionAmount: 1000 })).toThrow(CalculationDomainError);
  });
});
