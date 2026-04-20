import { BondInputs, RegularInvestmentInputs } from '../types';

type SanitizeTarget = Partial<BondInputs> | Partial<RegularInvestmentInputs> | Record<string, unknown>;

/**
 * Sanitizes calculation inputs to prevent edge cases or malicious values 
 * that could lead to NaN, Infinity, or memory exhaustion.
 */
export const sanitizeInputs = <T extends SanitizeTarget>(inputs: T): T => {
  const sanitized = { ...inputs } as Record<string, unknown>;

  const clamp = (val: number | undefined, min = -50, max = 500, fallback = 0) => {
    if (val === undefined || typeof val !== 'number' || isNaN(val)) return fallback;
    return Math.max(min, Math.min(max, val));
  };

  if (sanitized.firstYearRate !== undefined) {
    sanitized.firstYearRate = clamp(sanitized.firstYearRate as number);
  }
  if (sanitized.margin !== undefined) {
    sanitized.margin = clamp(sanitized.margin as number, -10, 50);
  }
  if (sanitized.initialInvestment !== undefined) {
    sanitized.initialInvestment = clamp(sanitized.initialInvestment as number, 0, 1_000_000_000_000); // 1 Trillion limit
  }
  if (sanitized.contributionAmount !== undefined) {
    sanitized.contributionAmount = clamp(sanitized.contributionAmount as number, 0, 100_000_000); 
  }
  if (sanitized.expectedInflation !== undefined) {
    sanitized.expectedInflation = clamp(sanitized.expectedInflation as number, -50, 500);
  }
  if (sanitized.expectedNbpRate !== undefined) {
    sanitized.expectedNbpRate = clamp(sanitized.expectedNbpRate as number, -10, 200);
  }
  if (sanitized.taxRate !== undefined) {
    sanitized.taxRate = clamp(sanitized.taxRate as number, 0, 100, 19);
  }
  
  // Paths for custom scenarios
  if (Array.isArray(sanitized.inflationPath)) {
    sanitized.inflationPath = (sanitized.inflationPath as number[]).map((v: number) => clamp(v));
  }
  if (Array.isArray(sanitized.wiborPath)) {
    sanitized.wiborPath = (sanitized.wiborPath as number[]).map((v: number) => clamp(v));
  }
  if (Array.isArray(sanitized.ratePath)) {
    sanitized.ratePath = (sanitized.ratePath as number[]).map((v: number) => clamp(v));
  }

  return sanitized as unknown as T;
};

/**
 * Higher-order function that wraps a calculation engine with sanity guards.
 * It catches runtime errors and ensures the result does not contain NaN/Infinity.
 */
export function withMathGuard<T, R>(fn: (inputs: T) => R): (inputs: T) => R {
  return (inputs: T): R => {
    try {
      const sanitized = sanitizeInputs(inputs as unknown as SanitizeTarget) as unknown as T;
      const result = fn(sanitized);

      // Check for unstable math in the result
      if (result && typeof result === 'object') {
        const res = result as Record<string, unknown>;
        const keysToCheck = ['totalProfit', 'netPayoutValue', 'finalNominalValue', 'totalInvested'];
        
        for (const key of keysToCheck) {
          const val = res[key];
          if (val !== undefined && (typeof val !== 'number' || isNaN(val) || !isFinite(val))) {
            throw new Error(`NaN or Infinite detected in calculation result field: ${key}`);
          }
        }
      }

      return result;
    } catch (err) {
      console.warn('[MathGuard] Sanity guard triggered, returning safe default:', err);
      
      const inp = inputs as Record<string, unknown>;
      const initial = (inp.initialInvestment as number) || (inp.contributionAmount as number) || 0;
      
      // Determine if it's a regular investment or single bond result type based on input
      const isRegular = inp.contributionAmount !== undefined;

      if (isRegular) {
        return {
          totalInvested: initial,
          finalNominalValue: initial,
          finalRealValue: initial,
          totalProfit: 0,
          totalTax: 0,
          totalEarlyWithdrawalFees: 0,
          realAnnualizedReturn: 0,
          timeline: [],
          lots: [],
          mathWarning: true
        } as unknown as R;
      }

      return {
        initialInvestment: initial,
        timeline: [],
        finalNominalValue: initial,
        finalRealValue: initial,
        totalProfit: 0,
        totalTax: 0,
        totalEarlyWithdrawalFee: 0,
        grossValue: initial,
        netPayoutValue: initial,
        isEarlyWithdrawal: false,
        maturityDate: new Date().toISOString(),
        nominalAnnualizedReturn: 0,
        realAnnualizedReturn: 0,
        mathWarning: true
      } as unknown as R;
    }
  };
}
