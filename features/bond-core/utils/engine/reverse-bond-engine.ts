import { BondInputs, CalculationResult } from '../../types';
import { createNumericFaultError } from '../../errors';
import { calculateBondInvestment } from './single-bond-engine';

function assertSingleBondTerminalResult(
  result: CalculationResult | null | undefined,
  context: string,
): asserts result is CalculationResult {
  if (!result) {
    throw createNumericFaultError(`${context}: calculation did not produce a terminal result.`);
  }

  if (!Array.isArray(result.timeline) || result.timeline.length < 2) {
    throw createNumericFaultError(`${context}: calculation produced an incomplete timeline.`, {
      details: {
        timelineLength: Array.isArray(result.timeline) ? result.timeline.length : 'missing',
      },
    });
  }

  const finalPoint = result.timeline[result.timeline.length - 1];
  if (!finalPoint?.isWithdrawal) {
    throw createNumericFaultError(
      `${context}: final timeline point is not a withdrawal checkpoint.`,
      {
        details: {
          finalPeriodLabel: finalPoint?.periodLabel,
          finalCycleEndDate: finalPoint?.cycleEndDate,
        },
      },
    );
  }

  if (!Number.isFinite(result.netPayoutValue) || !Number.isFinite(result.finalRealValue)) {
    throw createNumericFaultError(`${context}: terminal payout values are not finite.`, {
      details: {
        netPayoutValue: String(result.netPayoutValue),
        finalRealValue: String(result.finalRealValue),
      },
    });
  }
}

/**
 * Reverse calculation to find the required initial investment to reach a target net sum.
 * Uses a binary search approach.
 */
export function calculateReverseBondInvestment(
  inputs: BondInputs & { targetNetSum: number },
): CalculationResult {
  let low = 100;
  let high = 10_000_000;
  let result: CalculationResult | null = null;

  // 30 iterations give very high precision
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    // Round mid to nearest 100 as bonds are usually bought in units of 100 PLN
    const roundedMid = Math.ceil(mid / 100) * 100;

    result = calculateBondInvestment({ ...inputs, initialInvestment: roundedMid });

    if (result.netPayoutValue < inputs.targetNetSum) {
      low = mid;
    } else {
      high = mid;
    }
  }

  let finalInitialInvestment = Math.ceil(high / 100) * 100;
  result = calculateBondInvestment({ ...inputs, initialInvestment: finalInitialInvestment });

  while (result.netPayoutValue < inputs.targetNetSum && finalInitialInvestment < 100_000_000) {
    finalInitialInvestment += 100;
    result = calculateBondInvestment({ ...inputs, initialInvestment: finalInitialInvestment });
  }

  assertSingleBondTerminalResult(result, 'Reverse bond calculation');

  // Ensure notes reflect reverse mode
  result.calculationNotes = [
    ...(result.calculationNotes || []),
    `Target net sum: ${inputs.targetNetSum} PLN. Required initial investment: ${result.initialInvestment} PLN.`,
  ];

  return result;
}
