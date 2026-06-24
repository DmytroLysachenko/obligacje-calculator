import {
  ScenarioKind,
  PortfolioSimulationCalculationEnvelope,
  PortfolioSimulationPayload,
  PortfolioSimulationResult,
  PortfolioSimulationItem,
} from '../types/scenarios';
import { calculateBondInvestment } from '../utils/calculations';
import { BondInputs, TaxStrategy } from '../types';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';
import { addMonths, compareAsc, format, isBefore, parseISO } from 'date-fns';

function getEarliestPurchaseDate(investments: PortfolioSimulationPayload['investments']) {
  return investments.reduce(
    (min, investment) =>
      isBefore(parseISO(investment.purchaseDate), parseISO(min)) ? investment.purchaseDate : min,
    investments[0].purchaseDate,
  );
}

function getPointDate(point: PortfolioSimulationItem['result']['timeline'][number]) {
  return parseISO(point.cycleEndDate);
}

function getLatestPointAtOrBefore(item: PortfolioSimulationItem, currentDate: Date) {
  if (isBefore(currentDate, parseISO(item.purchaseDate))) {
    return null;
  }

  let latestPoint: PortfolioSimulationItem['result']['timeline'][number] | null = null;

  for (const point of item.result.timeline) {
    const pointDate = getPointDate(point);

    if (compareAsc(pointDate, currentDate) <= 0) {
      latestPoint = point;
      continue;
    }

    break;
  }

  return latestPoint;
}

function getProRatedFinalFee(item: PortfolioSimulationItem, currentDate: Date, maxDate: Date) {
  const result = item.result;

  if (result.totalEarlyWithdrawalFee <= 0) {
    return 0;
  }

  return compareAsc(currentDate, maxDate) === 0 ? result.totalEarlyWithdrawalFee : 0;
}

export class PortfolioSimulationHandler
  extends BaseHandler
  implements ScenarioHandler<PortfolioSimulationPayload, PortfolioSimulationResult>
{
  kind = ScenarioKind.PORTFOLIO_SIMULATION;

  async handle(
    payload: PortfolioSimulationPayload,
    context: HandlerContext,
  ): Promise<PortfolioSimulationCalculationEnvelope> {
    const items: PortfolioSimulationItem[] = [];
    const allHistoricalData = await this.withHistoricalData({
      purchaseDate: getEarliestPurchaseDate(payload.investments),
      withdrawalDate: payload.withdrawalDate,
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
        historicalData: allHistoricalData.historicalData as Record<
          string,
          import('@/features/bond-core/types').HistoricalEntry
        >,
      } as BondInputs & { rollover: boolean });
      items.push({
        bondType: inv.bondType,
        amount: inv.amount,
        purchaseDate: inv.purchaseDate,
        result,
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
        const point = getLatestPointAtOrBefore(item, curr);
        if (point) {
          totalNominalValue += point.nominalValueAfterInterest;
          totalNetValue += point.totalValue;
          totalProfit += point.netProfit;
          totalTax += point.taxDeducted;
          totalFees += getProRatedFinalFee(item, curr, maxDate);
        }
      }

      aggregatedTimeline.push({
        date: dateStr,
        totalNominalValue,
        totalNetValue,
        totalProfit,
        totalTax,
        totalFees,
      });
      curr = addMonths(curr, 1);
    }

    const result: PortfolioSimulationResult = {
      items,
      aggregatedTimeline,
      summary: {
        totalInvested: items.reduce((sum, item) => sum + item.amount, 0),
        totalNetValue: aggregatedTimeline[aggregatedTimeline.length - 1]?.totalNetValue || 0,
        totalProfit: aggregatedTimeline[aggregatedTimeline.length - 1]?.totalProfit || 0,
      },
    };

    return this.createEnvelope(
      result,
      [],
      [
        'Portfolio simulation aggregates lot timelines by checkpoint date and carries the latest known lot value between sparse engine points.',
        'Total fees are reported as redemption fees, not early-exit payout values.',
      ],
      context.dataFreshness,
    );
  }
}
