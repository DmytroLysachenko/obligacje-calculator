import { 
  ScenarioKind, 
  RetirementPlannerCalculationEnvelope, 
  RetirementPlannerPayload,
  RetirementPlannerResult
} from '../types/scenarios';
import { TaxStrategy } from '../types';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';
import { format, addMonths, parseISO } from 'date-fns';
import Decimal from 'decimal.js';
import { BondType } from '../types';

export class RetirementPlannerHandler extends BaseHandler implements ScenarioHandler<RetirementPlannerPayload, RetirementPlannerResult> {
  kind = ScenarioKind.RETIREMENT_PLANNER;

  private resolveModeledAnnualRate(payload: RetirementPlannerPayload, context: HandlerContext) {
    const bondDef = context.dbDefinitions[payload.bondType];

    if (payload.bondType === BondType.ROR || payload.bondType === BondType.DOR) {
      return payload.expectedNbpRate ?? bondDef.firstYearRate;
    }

    if (
      payload.bondType === BondType.EDO ||
      payload.bondType === BondType.COI ||
      payload.bondType === BondType.ROS ||
      payload.bondType === BondType.ROD
    ) {
      return payload.expectedInflation + bondDef.margin;
    }

    return bondDef.firstYearRate;
  }

  async handle(payload: RetirementPlannerPayload, context: HandlerContext): Promise<RetirementPlannerCalculationEnvelope> {
    const horizonMonths = payload.horizonYears * 12;
    const purchaseDate = format(new Date(), 'yyyy-MM-dd');
    const modeledAnnualRate = this.resolveModeledAnnualRate(payload, context);

    let currentBalance = payload.initialCapital;
    const timeline: RetirementPlannerResult['timeline'] = [];
    let totalWithdrawn = 0;
    let totalTaxPaid = 0;
    let exhaustionMonth: number | undefined;
    let exhaustionDate: string | undefined;

    const monthlyWithdrawal = payload.monthlyWithdrawal;
    const start = parseISO(purchaseDate);

    for (let m = 0; m <= horizonMonths; m++) {
      const currentDate = addMonths(start, m);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      if (m > 0) {
        const withdrawalAmount = Math.min(currentBalance, monthlyWithdrawal);
        currentBalance -= withdrawalAmount;
        totalWithdrawn += withdrawalAmount;

        if (currentBalance <= 0 && exhaustionMonth === undefined) {
          exhaustionMonth = m;
        }
      }

      const monthlyRate = new Decimal(modeledAnnualRate).dividedBy(12).dividedBy(100);
      const interest = new Decimal(currentBalance).times(monthlyRate);
      
      const tax = payload.taxStrategy === TaxStrategy.STANDARD 
        ? interest.times(0.19)
        : new Decimal(0);
      totalTaxPaid += tax.toNumber();
      
      currentBalance += interest.minus(tax).toNumber();

      timeline.push({
        year: Math.floor(m / 12),
        month: m % 12,
        date: dateStr,
        balance: Math.max(0, currentBalance),
        withdrawal: m > 0 ? Math.min(payload.monthlyWithdrawal, currentBalance + (m > 0 ? monthlyWithdrawal : 0)) : 0,
        isProjected: true
      });

      if (currentBalance <= 0 && m > 0) {
        exhaustionDate = dateStr;
        break;
      }
    }

    const result: RetirementPlannerResult = {
      isSustainable: currentBalance > 0 && (exhaustionMonth === undefined || exhaustionMonth >= horizonMonths),
      exhaustionYear: exhaustionMonth ? Math.floor(exhaustionMonth / 12) : undefined,
      exhaustionMonth: exhaustionMonth ? exhaustionMonth % 12 : undefined,
      exhaustionDate,
      finalBalance: Math.max(0, currentBalance),
      totalWithdrawn,
      totalTaxPaid,
      modeledAnnualRate,
      modeledMonthlyNetRate: payload.taxStrategy === TaxStrategy.STANDARD
        ? modeledAnnualRate / 12 * 0.81
        : modeledAnnualRate / 12,
      modeledBondType: payload.bondType,
      modelType: 'steady-rate',
      timeline
    };

    const assumptions = this.generateAssumptions(payload);
    assumptions.push(`Retirement horizon: ${payload.horizonYears} years`);
    assumptions.push(`Desired monthly withdrawal: ${payload.monthlyWithdrawal} PLN`);
    assumptions.push(`Model type: steady-rate depletion model using ${payload.bondType}.`);
    assumptions.push(`Modeled annual rate: ${modeledAnnualRate.toFixed(2)}%.`);

    return this.createEnvelope(result, [], assumptions, context.dataFreshness);
  }
}
