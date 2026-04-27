import { 
  ScenarioKind, 
  PortfolioSimulationCalculationEnvelope, 
  PortfolioSimulationPayload,
  PortfolioSimulationResult,
  PortfolioSimulationItem
} from '../types/scenarios';
import { calculateBondInvestment } from '../utils/calculations';
import { BondInputs, TaxStrategy } from '../types';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';
import { isBefore, parseISO, format, addMonths } from 'date-fns';

export class PortfolioSimulationHandler extends BaseHandler implements ScenarioHandler<PortfolioSimulationPayload, PortfolioSimulationResult> {
  kind = ScenarioKind.PORTFOLIO_SIMULATION;

  async handle(payload: PortfolioSimulationPayload, context: HandlerContext): Promise<PortfolioSimulationCalculationEnvelope> {
    const items: PortfolioSimulationItem[] = [];
    const allHistoricalData = await this.withHistoricalData({
      purchaseDate: payload.investments.reduce((min, inv) => isBefore(parseISO(inv.purchaseDate), parseISO(min)) ? inv.purchaseDate : min, payload.investments[0].purchaseDate),
      withdrawalDate: payload.withdrawalDate
    });

    for (const inv of payload.investments) {
      const def = context.dbDefinitions[inv.bondType];
      const result = calculateBondInvestment({
        bondType: inv.bondType,
        initialInvestment: inv.amount,
        firstYearRate: def.firstYearRate,
        expectedInflation: payload.expectedInflation,
        expectedNbpRate: payload.expectedNbpRate ?? 5.25,
        margin: def.margin,
        duration: def.duration,
        earlyWithdrawalFee: def.earlyWithdrawalFee,
        taxRate: 19,
        isCapitalized: def.isCapitalized,
        payoutFrequency: def.payoutFrequency,
        purchaseDate: inv.purchaseDate,
        withdrawalDate: payload.withdrawalDate,
        isRebought: inv.isRebought ?? false,
        rebuyDiscount: def.rebuyDiscount,
        taxStrategy: inv.taxStrategy ?? TaxStrategy.STANDARD,
        rollover: inv.rollover ?? false,
        historicalData: allHistoricalData.historicalData as Record<string, import('@/features/bond-core/types').HistoricalEntry>,
        chartStep: 'monthly'
      } as BondInputs & { rollover: boolean });
      items.push({
        bondType: inv.bondType,
        amount: inv.amount,
        purchaseDate: inv.purchaseDate,
        result
      });
    }

    const aggregatedTimeline: PortfolioSimulationResult['aggregatedTimeline'] = [];
    const minDate = parseISO(allHistoricalData.purchaseDate);
    const maxDate = parseISO(payload.withdrawalDate);
    let curr = minDate;
    while (!isBefore(maxDate, curr)) {
      const dateStr = format(curr, 'yyyy-MM-dd');
      let totalNominalValue = 0;
      let totalNetValue = 0;
      let totalProfit = 0;
      let totalTax = 0;
      let totalFees = 0;

      for (const item of items) {
        const point = item.result.timeline.find(p => p.periodLabel === format(curr, 'MMM yyyy'));
        if (point) {
          totalNominalValue += point.nominalValueAfterInterest;
          totalNetValue += point.totalValue;
          totalProfit += point.netProfit; 
          totalTax += point.taxDeducted;
          totalFees += point.earlyWithdrawalValue;
        }
      }

      aggregatedTimeline.push({
        date: dateStr,
        totalNominalValue,
        totalNetValue,
        totalProfit,
        totalTax,
        totalFees
      });
      curr = addMonths(curr, 1);
    }

    const result: PortfolioSimulationResult = {
      items,
      aggregatedTimeline,
      summary: {
        totalInvested: items.reduce((sum, item) => sum + item.amount, 0),
        totalNetValue: aggregatedTimeline[aggregatedTimeline.length - 1]?.totalNetValue || 0,
        totalProfit: aggregatedTimeline[aggregatedTimeline.length - 1]?.totalProfit || 0
      }
    };

    return this.createEnvelope(result, [], [], context.dataFreshness);
  }
}
