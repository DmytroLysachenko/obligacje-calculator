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

      // Check for unstable math in summary if it exists
      if (result && typeof result === 'object' && 'summary' in result) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summary = (result as any).summary;
        if (summary && (isNaN(summary.netProfit) || !isFinite(summary.netProfit))) {
          throw new Error('NaN or Infinite detected in calculation summary');
        }
      }

      return result;
    } catch (err) {
      console.warn('Math sanity guard triggered, returning safe default:', err);
      // Return safe default with warning flag
      return {
        timeline: [],
        summary: {
          totalInterest: 0,
          netProfit: 0,
          totalTax: 0,
          earlyWithdrawalFees: 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          finalNominalValue: (inputs as any).initialInvestment || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          totalValue: (inputs as any).initialInvestment || 0,
        },
        mathWarning: true
      } as unknown as R;
    }
  };
}
