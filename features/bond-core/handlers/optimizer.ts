import {
  ScenarioKind,
  BondOptimizerCalculationEnvelope,
  BondOptimizerPayload,
  BondOptimizerResult,
  BondOptimizerResultItem,
} from '../types/scenarios';
import { calculateBondInvestment } from '../utils/calculations';
import { BondType, TaxStrategy, BondInputs } from '../types';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';
import { getWithdrawalDateFromMonths, differenceInMonths } from '@/shared/lib/date-timing';
import { parseISO } from 'date-fns';

export class OptimizerHandler extends BaseHandler implements ScenarioHandler<BondOptimizerPayload, BondOptimizerResult> {
  kind = ScenarioKind.BOND_OPTIMIZER;

  async handle(payload: BondOptimizerPayload, context: HandlerContext): Promise<BondOptimizerCalculationEnvelope> {
    const allBondTypes = Object.keys(context.dbDefinitions) as BondType[];
    const withdrawalDate = payload.withdrawalDate
      ?? (payload.investmentHorizonMonths ? getWithdrawalDateFromMonths(payload.purchaseDate, payload.investmentHorizonMonths) : undefined);

    if (!withdrawalDate) {
      throw new Error('Withdrawal date or investment horizon is required for optimization');
    }

    const horizonMonths = differenceInMonths(parseISO(payload.purchaseDate), parseISO(withdrawalDate));
    const horizonYears = horizonMonths / 12;

    const rankedBonds: BondOptimizerResultItem[] = [];

    for (const bondType of allBondTypes) {
      const def = context.dbDefinitions[bondType];

      if (def.isFamilyOnly && !payload.includeFamilyBonds) {
        continue;
      }

      const enrichedInputs = await this.withHistoricalData({
        bondType,
        initialInvestment: payload.initialInvestment,
        firstYearRate: def.firstYearRate,
        expectedInflation: payload.expectedInflation,
        expectedNbpRate: payload.expectedNbpRate ?? 5.25,
        margin: def.margin,
        duration: def.duration,
        earlyWithdrawalFee: def.earlyWithdrawalFee,
        taxRate: 19,
        isCapitalized: def.isCapitalized,
        payoutFrequency: def.payoutFrequency,
        purchaseDate: payload.purchaseDate,
        withdrawalDate,
        isRebought: false,
        rebuyDiscount: def.rebuyDiscount,
        taxStrategy: payload.taxStrategy ?? TaxStrategy.STANDARD,
        rollover: true,
        chartStep: 'monthly' as import('@/features/bond-core/types').ChartStep,
      });

      const result = calculateBondInvestment(enrichedInputs as BondInputs & { rollover: boolean });

      let reason = '';
      if (def.duration === horizonYears) {
        reason = `Duration closely matches your ${horizonYears}-year horizon.`;
      } else if (def.duration < horizonYears) {
        reason = `Shorter duration (${def.duration}y) requires rollover to cover your full horizon.`;
      } else {
        reason = `Longer duration (${def.duration}y) implies early redemption around year ${horizonYears.toFixed(1)}.`;
      }

      if (def.isInflationIndexed) {
        reason += ' Protection against rising inflation.';
      }

      rankedBonds.push({
        bondType,
        name: def.fullName.en,
        netPayoutValue: result.netPayoutValue,
        totalProfit: result.totalProfit,
        effectiveTaxRate: result.totalProfit > 0 ? (result.totalTax / result.totalProfit) * 100 : 0,
        isWinner: false,
        recommendationReason: reason,
        result,
      });
    }

    rankedBonds.sort((a, b) => b.netPayoutValue - a.netPayoutValue);

    if (rankedBonds.length > 0) {
      rankedBonds[0].isWinner = true;
    }

    const assumptions = this.generateAssumptions(payload);
    assumptions.push(`Ranking metric: Highest projected net payout after ${horizonYears.toFixed(1)} years in this scenario.`);

    return this.createEnvelope({
      rankedBonds,
      winner: rankedBonds[0],
    }, [], assumptions, context.dataFreshness);
  }
}
