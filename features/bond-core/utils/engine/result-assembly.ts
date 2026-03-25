import { format } from 'date-fns';
import { Decimal } from 'decimal.js';
import { CalculationResult, RegularInvestmentResult, RegularTimelinePoint, YearlyTimelinePoint } from '../../types';

interface SingleBondResultParams {
  startDate: Date;
  firstYearRate: number;
  initialInvestment: number;
  expectedInflation: number;
  expectedNbpRate: number;
}

export function createInitialTimelinePoint({
  startDate,
  firstYearRate,
  initialInvestment,
  expectedInflation,
  expectedNbpRate,
}: SingleBondResultParams): YearlyTimelinePoint {
  return {
    year: 0,
    periodLabel: format(startDate, 'MMM yyyy'),
    interestRate: firstYearRate,
    nominalValueBeforeInterest: initialInvestment,
    interestEarned: 0,
    taxDeducted: 0,
    netInterest: 0,
    nominalValueAfterInterest: initialInvestment,
    accumulatedNetInterest: 0,
    totalValue: initialInvestment,
    realValue: initialInvestment,
    netProfit: 0,
    earlyWithdrawalValue: 0,
    cumulativeInflation: 1,
    isMaturity: false,
    isWithdrawal: false,
    isProjected: false,
    inflationReference: expectedInflation,
    nbpReference: expectedNbpRate,
  };
}

interface FinalSingleBondResultParams {
  initialInvestment: number;
  timeline: YearlyTimelinePoint[];
  cycleGrossValue: Decimal;
  cycleNetProceeds: Decimal;
  totalTax: Decimal;
  totalFee: Decimal;
  isEarlyWithdrawal: boolean;
  cycleMaturityDate: Date;
}

export function createFinalSingleBondResult({
  initialInvestment,
  timeline,
  cycleGrossValue,
  cycleNetProceeds,
  totalTax,
  totalFee,
  isEarlyWithdrawal,
  cycleMaturityDate,
}: FinalSingleBondResultParams): CalculationResult {
  const lastPoint = timeline[timeline.length - 1];

  return {
    initialInvestment,
    timeline,
    finalNominalValue: cycleGrossValue.toNumber(),
    finalRealValue: lastPoint.realValue,
    totalProfit: cycleNetProceeds.minus(initialInvestment).toNumber(),
    totalTax: totalTax.toNumber(),
    totalEarlyWithdrawalFee: totalFee.toNumber(),
    grossValue: cycleGrossValue.toNumber(),
    netPayoutValue: cycleNetProceeds.toNumber(),
    isEarlyWithdrawal,
    maturityDate: cycleMaturityDate.toISOString(),
  };
}

export function calculateRealAnnualizedReturn(
  totalHorizon: number,
  totalInvested: Decimal,
  lastPoint: RegularTimelinePoint,
): number {
  if (totalHorizon <= 0 || totalInvested.lte(0)) {
    return 0;
  }

  const totalMultiplier = new Decimal(lastPoint.realValue).dividedBy(totalInvested);
  if (totalMultiplier.lte(0)) {
    return 0;
  }

  return (Math.pow(totalMultiplier.toNumber(), 1 / totalHorizon) - 1) * 100;
}

export function createRegularInvestmentResult(
  totalInvested: Decimal,
  totalHorizon: number,
  timeline: RegularTimelinePoint[],
  lots: RegularInvestmentResult['lots'],
): RegularInvestmentResult {
  const lastPoint = timeline[timeline.length - 1];

  return {
    totalInvested: totalInvested.toNumber(),
    finalNominalValue: lastPoint.nominalValue,
    finalRealValue: lastPoint.realValue,
    totalProfit: lastPoint.profit,
    totalTax: lastPoint.tax,
    totalEarlyWithdrawalFees: lastPoint.earlyWithdrawalFees,
    realAnnualizedReturn: calculateRealAnnualizedReturn(totalHorizon, totalInvested, lastPoint),
    timeline,
    lots,
  };
}
