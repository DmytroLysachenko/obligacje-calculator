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

export class RetirementPlannerHandler extends BaseHandler implements ScenarioHandler<RetirementPlannerPayload, RetirementPlannerResult> {
  kind = ScenarioKind.RETIREMENT_PLANNER;

  async handle(payload: RetirementPlannerPayload, context: HandlerContext): Promise<RetirementPlannerCalculationEnvelope> {
    const horizonMonths = payload.horizonYears * 12;
    const bondDef = context.dbDefinitions[payload.bondType];
    const purchaseDate = format(new Date(), 'yyyy-MM-dd');

    let currentBalance = payload.initialCapital;
    const timeline: RetirementPlannerResult['timeline'] = [];
    let totalWithdrawn = 0;
    let exhaustionMonth: number | undefined;

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

      const monthlyRate = new Decimal(bondDef.firstYearRate).dividedBy(12).dividedBy(100);
      const interest = new Decimal(currentBalance).times(monthlyRate);
      
      const tax = payload.taxStrategy === TaxStrategy.STANDARD 
        ? interest.times(0.19)
        : new Decimal(0);
      
      currentBalance += interest.minus(tax).toNumber();

      timeline.push({
        year: Math.floor(m / 12),
        month: m % 12,
        date: dateStr,
        balance: Math.max(0, currentBalance),
        withdrawal: m > 0 ? Math.min(payload.monthlyWithdrawal, currentBalance + (m > 0 ? monthlyWithdrawal : 0)) : 0,
        isProjected: true
      });

      if (currentBalance <= 0 && m > 0) break;
    }

    const result: RetirementPlannerResult = {
      isSustainable: currentBalance > 0 && (exhaustionMonth === undefined || exhaustionMonth >= horizonMonths),
      exhaustionYear: exhaustionMonth ? Math.floor(exhaustionMonth / 12) : undefined,
      exhaustionMonth: exhaustionMonth ? exhaustionMonth % 12 : undefined,
      finalBalance: Math.max(0, currentBalance),
      totalWithdrawn,
      timeline
    };

    const assumptions = this.generateAssumptions(payload);
    assumptions.push(`Retirement horizon: ${payload.horizonYears} years`);
    assumptions.push(`Desired monthly withdrawal: ${payload.monthlyWithdrawal} PLN`);

    return this.createEnvelope(result, [], assumptions, context.dataFreshness);
  }
}
