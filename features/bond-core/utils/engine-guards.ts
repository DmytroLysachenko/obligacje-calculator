// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeInputs = (inputs: any): any => {
  const sanitized = { ...inputs };

  const clamp = (val: number, min = -50, max = 500) => {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    return Math.max(min, Math.min(max, val));
  };

  if (sanitized.firstYearRate !== undefined) {
    sanitized.firstYearRate = clamp(sanitized.firstYearRate);
  }
  if (sanitized.margin !== undefined) {
    sanitized.margin = clamp(sanitized.margin);
  }
  if (sanitized.initialInvestment !== undefined) {
    sanitized.initialInvestment = clamp(sanitized.initialInvestment, 0, Number.MAX_SAFE_INTEGER);
  }
  
  if (Array.isArray(sanitized.inflationPath)) {
    sanitized.inflationPath = sanitized.inflationPath.map((v: number) => clamp(v));
  }
  if (Array.isArray(sanitized.wiborPath)) {
    sanitized.wiborPath = sanitized.wiborPath.map((v: number) => clamp(v));
  }
  if (Array.isArray(sanitized.ratePath)) {
    sanitized.ratePath = sanitized.ratePath.map((v: number) => clamp(v));
  }

  return sanitized;
};

export function withMathGuard<T, R>(fn: (inputs: T) => R): (inputs: T) => R {
  return (inputs: T): R => {
    try {
      const sanitized = sanitizeInputs(inputs);
      const result = fn(sanitized);

      // Check for unstable math in the result
      if (result && typeof result === 'object' && 'totalProfit' in result) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profit = (result as any).totalProfit;
        if (profit !== undefined && (isNaN(profit) || !isFinite(profit))) {
          throw new Error('NaN or Infinite detected in calculation result');
        }
      }

      return result;
    } catch (err) {
      console.warn('Math sanity guard triggered, returning safe default:', err);
      // Return safe default with warning flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initial = (inputs as any).initialInvestment || 0;
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
        mathWarning: true
      } as unknown as R;
    }
  };
}
