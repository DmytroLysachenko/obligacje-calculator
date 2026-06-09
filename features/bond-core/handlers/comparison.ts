import { 
  ScenarioKind, 
  BondComparisonCalculationEnvelope, 
  NormalizedBondComparisonPayload,
  IndependentBondComparisonPayload,
  BondComparisonScenarioItem
} from '../types/scenarios';
import { BondComparisonScenarioRequestSchema } from '../types/schemas';
import { calculateBondInvestment } from '../utils/calculations';
import { BondInputs, CalculationResult, TaxStrategy, YearlyTimelinePoint } from '../types';
import { BaseHandler, ScenarioHandler, HandlerContext } from './base';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';
import { shouldAutoRollover } from './rollover';
import { resolveScenarioInputs } from './resolved-inputs';
import { addMonths, differenceInDays, differenceInMonths, format, isAfter, parseISO } from 'date-fns';
import { Decimal } from 'decimal.js';
import { calculateCumulativeInflation } from '../utils/engine/inflation';
import { calculateCAGR, calculateRealValue } from '../utils/engine/real-return';
import { BOND_DEFINITIONS } from '../constants/bond-definitions';

export class ComparisonHandler extends BaseHandler implements ScenarioHandler<NormalizedBondComparisonPayload | IndependentBondComparisonPayload, BondComparisonScenarioItem[]> {
  kind = ScenarioKind.BOND_COMPARISON;

  async handle(payload: NormalizedBondComparisonPayload | IndependentBondComparisonPayload, context: HandlerContext): Promise<BondComparisonCalculationEnvelope> {
    const request = BondComparisonScenarioRequestSchema.parse({
      kind: ScenarioKind.BOND_COMPARISON,
      payload,
    });

    if (request.payload.mode === 'independent') {
      return this.calculateIndependentComparison(request.payload as IndependentBondComparisonPayload, context);
    }

    return this.calculateNormalizedComparison(request.payload as NormalizedBondComparisonPayload, context);
  }

  private async calculateNormalizedComparison(
    payload: NormalizedBondComparisonPayload,
    context: HandlerContext
  ): Promise<BondComparisonCalculationEnvelope> {
    const scenarioInputs = await this.buildComparisonScenarioInputs(payload, context);
    const enrichedScenarios = await Promise.all(
      scenarioInputs.map((scenarioInput) => this.withHistoricalData(scenarioInput))
    );

    const results = enrichedScenarios.map((enrichedInputs): BondComparisonScenarioItem => {
      const def = context.dbDefinitions[enrichedInputs.bondType];
      const resolvedRollover = shouldAutoRollover(enrichedInputs, def.duration);
      const adjustedInputs = {
        ...enrichedInputs,
        expectedInflation: this.applyInflationScenario(
          enrichedInputs.expectedInflation,
          enrichedInputs.inflationScenario,
        ),
      };
      return {
        type: enrichedInputs.bondType,
        name: def.fullName.en,
        result: calculateBondInvestment({
          ...adjustedInputs,
          rollover: resolvedRollover,
        } as BondInputs & { rollover: boolean }),
      };
    });

    const warnings = this.collectHistoricalWarnings(enrichedScenarios.map((scenario) => scenario.historicalData));
    const assumptions = this.generateAssumptions(payload);
    assumptions.push('Comparison scenarios are normalized through the shared comparison service.');
    assumptions.push('Each bond uses the nearest issued series available for the shared purchase date when present.');
    assumptions.push('Rollover is inferred automatically when the shared horizon exceeds a bond’s native term.');

    return this.createEnvelope(results, warnings, assumptions, context.dataFreshness);
  }

  private async calculateIndependentComparison(
    payload: IndependentBondComparisonPayload,
    context: HandlerContext
  ): Promise<BondComparisonCalculationEnvelope> {
    const maturityMode = payload.sharedConfig.maturityMode ?? 'reinvest_until_horizon';
    const sharedConfig = this.applySharedMaturityMode(payload);
    const [scenarioA, scenarioB] = await Promise.all([
      this.buildIndependentScenarioInputs(sharedConfig, payload.scenarioA, context).then((inputs) => this.withHistoricalData(inputs)),
      this.buildIndependentScenarioInputs(sharedConfig, payload.scenarioB, context).then((inputs) => this.withHistoricalData(inputs)),
    ]);

    const resultA = calculateBondInvestment({
      ...{
        ...scenarioA,
        expectedInflation: this.applyInflationScenario(
          scenarioA.expectedInflation,
          scenarioA.inflationScenario,
        ),
      },
      rollover: this.resolveComparisonRollover(maturityMode, scenarioA, context.dbDefinitions[scenarioA.bondType].duration),
    } as BondInputs & { rollover: boolean });

    const resultB = calculateBondInvestment({
      ...{
        ...scenarioB,
        expectedInflation: this.applyInflationScenario(
          scenarioB.expectedInflation,
          scenarioB.inflationScenario,
        ),
      },
      rollover: this.resolveComparisonRollover(maturityMode, scenarioB, context.dbDefinitions[scenarioB.bondType].duration),
    } as BondInputs & { rollover: boolean });

    const results: BondComparisonScenarioItem[] = [
      {
        scenarioKey: 'scenarioA',
        type: scenarioA.bondType,
        name: context.dbDefinitions[scenarioA.bondType].fullName.en,
        result: this.applyCashAfterMaturity(maturityMode, scenarioA, resultA),
      },
      {
        scenarioKey: 'scenarioB',
        type: scenarioB.bondType,
        name: context.dbDefinitions[scenarioB.bondType].fullName.en,
        result: this.applyCashAfterMaturity(maturityMode, scenarioB, resultB),
      },
    ];

    const warnings = this.collectHistoricalWarnings([scenarioA.historicalData, scenarioB.historicalData]);
    const assumptions = [
      ...this.generateScenarioAssumptions('Scenario A', payload.scenarioA),
      ...this.generateScenarioAssumptions('Scenario B', payload.scenarioB),
    ];
    assumptions.push('Independent comparison resolves issued-series terms per scenario purchase date when present.');
    assumptions.push(`Maturity handling: ${this.getComparisonMaturityModeLabel(maturityMode)}.`);
    assumptions.push(this.describeComparisonMaturityMode(maturityMode));

    return this.createEnvelope(results, warnings, assumptions, context.dataFreshness);
  }

  private applySharedMaturityMode(
    payload: IndependentBondComparisonPayload,
  ): IndependentBondComparisonPayload['sharedConfig'] {
    const maturityMode = payload.sharedConfig.maturityMode ?? 'reinvest_until_horizon';

    if (maturityMode !== 'align_to_shorter_duration') {
      return payload.sharedConfig;
    }

    const sharedHorizonMonths = payload.sharedConfig.investmentHorizonMonths
      ?? Math.max(1, differenceInMonths(
        parseISO(payload.sharedConfig.withdrawalDate),
        parseISO(payload.sharedConfig.purchaseDate),
      ));
    const scenarioADurationMonths = Math.round(BOND_DEFINITIONS[payload.scenarioA.bondType].duration * 12);
    const scenarioBDurationMonths = Math.round(BOND_DEFINITIONS[payload.scenarioB.bondType].duration * 12);
    const alignedHorizonMonths = Math.max(
      1,
      Math.min(sharedHorizonMonths, scenarioADurationMonths, scenarioBDurationMonths),
    );

    return {
      ...payload.sharedConfig,
      timingMode: 'general',
      investmentHorizonMonths: alignedHorizonMonths,
      withdrawalDate: getWithdrawalDateFromMonths(payload.sharedConfig.purchaseDate, alignedHorizonMonths),
    };
  }

  private resolveComparisonRollover(
    maturityMode: IndependentBondComparisonPayload['sharedConfig']['maturityMode'],
    inputs: BondInputs,
    durationYears: number,
  ) {
    if (maturityMode === 'hold_to_maturity' || maturityMode === 'cash_after_maturity' || maturityMode === 'align_to_shorter_duration') {
      return false;
    }

    return shouldAutoRollover(inputs, durationYears);
  }

  private applyCashAfterMaturity(
    maturityMode: IndependentBondComparisonPayload['sharedConfig']['maturityMode'],
    inputs: BondInputs,
    result: CalculationResult,
  ): CalculationResult {
    if (maturityMode !== 'cash_after_maturity') {
      return result;
    }

    const targetWithdrawalDate = parseISO(inputs.withdrawalDate);
    const lastPoint = result.timeline.at(-1);
    if (!lastPoint) {
      return result;
    }

    const maturityDate = parseISO(lastPoint.cycleEndDate);
    if (!isAfter(targetWithdrawalDate, maturityDate)) {
      return result;
    }

    const startDate = parseISO(inputs.purchaseDate);
    const cashValue = new Decimal(result.netPayoutValue);
    const extension: YearlyTimelinePoint[] = [];

    for (
      let cursor = addMonths(maturityDate, 1);
      !isAfter(cursor, targetWithdrawalDate);
      cursor = addMonths(cursor, 1)
    ) {
      extension.push(this.createCashHoldingPoint({
        basePoint: lastPoint,
        date: cursor,
        startDate,
        cashValue,
        inputs,
        isFinal: cursor.getTime() === targetWithdrawalDate.getTime(),
      }));
    }

    if (extension.length === 0 || extension.at(-1)?.cycleEndDate !== targetWithdrawalDate.toISOString()) {
      extension.push(this.createCashHoldingPoint({
        basePoint: lastPoint,
        date: targetWithdrawalDate,
        startDate,
        cashValue,
        inputs,
        isFinal: true,
      }));
    }

    const timeline = [
      ...result.timeline.map((point) => ({ ...point, isWithdrawal: false })),
      ...extension,
    ];
    const finalPoint = timeline[timeline.length - 1];
    const horizonYears = Math.max(1 / 12, differenceInDays(targetWithdrawalDate, startDate) / 365.25);

    return {
      ...result,
      timeline,
      finalNominalValue: cashValue.toNumber(),
      finalRealValue: finalPoint.realValue,
      grossValue: cashValue.toNumber(),
      netPayoutValue: cashValue.toNumber(),
      totalProfit: cashValue.minus(inputs.initialInvestment).toNumber(),
      nominalAnnualizedReturn: calculateCAGR(new Decimal(inputs.initialInvestment), cashValue, horizonYears).toNumber(),
      realAnnualizedReturn: calculateCAGR(new Decimal(inputs.initialInvestment), new Decimal(finalPoint.realValue), horizonYears).toNumber(),
      calculationNotes: [
        ...(result.calculationNotes ?? []),
        'After maturity, bond proceeds are modeled as cash with no further nominal interest.',
      ],
    };
  }

  private createCashHoldingPoint({
    basePoint,
    date,
    startDate,
    cashValue,
    inputs,
    isFinal,
  }: {
    basePoint: YearlyTimelinePoint;
    date: Date;
    startDate: Date;
    cashValue: Decimal;
    inputs: BondInputs;
    isFinal: boolean;
  }): YearlyTimelinePoint {
    const monthsFromStart = Math.max(0, differenceInMonths(date, startDate));
    const cumulativeInflation = calculateCumulativeInflation(
      monthsFromStart,
      inputs.expectedInflation,
      inputs.customInflation,
      startDate,
    );

    return {
      ...basePoint,
      year: monthsFromStart / 12,
      periodLabel: format(date, 'MMM yyyy'),
      cycleEndDate: date.toISOString(),
      interestRate: 0,
      rateSource: 'fixed_rate',
      rateReferenceValue: 0,
      rateMarginApplied: 0,
      usedProjectedRate: true,
      nominalValueBeforeInterest: cashValue.toNumber(),
      interestEarned: 0,
      taxDeducted: 0,
      netInterest: 0,
      nominalValueAfterInterest: cashValue.toNumber(),
      accumulatedNetInterest: 0,
      totalValue: cashValue.toNumber(),
      realValue: calculateRealValue(cashValue, cumulativeInflation).toNumber(),
      netProfit: cashValue.minus(inputs.initialInvestment).toNumber(),
      earlyWithdrawalValue: cashValue.toNumber(),
      cumulativeInflation: cumulativeInflation.toNumber(),
      isMaturity: false,
      isWithdrawal: isFinal,
      isProjected: true,
      events: undefined,
    };
  }

  private describeComparisonMaturityMode(
    maturityMode: IndependentBondComparisonPayload['sharedConfig']['maturityMode'],
  ) {
    switch (maturityMode) {
      case 'hold_to_maturity':
        return 'Each scenario stops after its native bond maturity or earlier selected exit date.';
      case 'cash_after_maturity':
        return 'After native maturity, proceeds are treated as cash without additional nominal interest until the selected horizon.';
      case 'align_to_shorter_duration':
        return 'Both scenarios are evaluated only until the shorter native maturity within the selected horizon.';
      case 'reinvest_until_horizon':
      default:
        return 'Matured proceeds are reinvested until the selected comparison horizon.';
    }
  }

  private getComparisonMaturityModeLabel(
    maturityMode: IndependentBondComparisonPayload['sharedConfig']['maturityMode'],
  ) {
    switch (maturityMode) {
      case 'hold_to_maturity':
        return 'Compare original maturities';
      case 'cash_after_maturity':
        return 'Move to cash after maturity';
      case 'align_to_shorter_duration':
        return 'Compare until first maturity';
      case 'reinvest_until_horizon':
      default:
        return 'Reinvest until selected horizon';
    }
  }

  private async buildComparisonScenarioInputs(
    request: NormalizedBondComparisonPayload,
    context: HandlerContext
  ): Promise<BondInputs[]> {
    return Promise.all(request.bondTypes.map(async (type) => {
      const { inputs: resolvedInputs } = await resolveScenarioInputs({
        inputs: {
          bondType: type,
          purchaseDate: request.purchaseDate,
        },
        context,
      });

      return {
        ...resolvedInputs,
        initialInvestment: request.initialInvestment,
        expectedInflation: request.expectedInflation,
        expectedNbpRate: request.expectedNbpRate ?? 5.25,
        customInflation: request.customInflation,
        customNbpRate: request.customNbpRate,
        inflationScenario: request.inflationScenario,
        taxRate: 19,
        withdrawalDate: request.withdrawalDate,
        isRebought: false,
        taxStrategy: request.taxStrategy ?? TaxStrategy.STANDARD,
        timingMode: 'exact' as import('@/shared/lib/date-timing').TimingMode,
        investmentHorizonMonths: undefined,
      };
    }));
  }

  private async buildIndependentScenarioInputs(
    sharedConfig: IndependentBondComparisonPayload['sharedConfig'],
    scenario: IndependentBondComparisonPayload['scenarioA'],
    context: HandlerContext
  ): Promise<BondInputs> {
    const purchaseDate = scenario.purchaseDate ?? sharedConfig.purchaseDate;
    const { inputs: resolvedInputs } = await resolveScenarioInputs({
      inputs: {
        bondType: scenario.bondType,
        purchaseDate,
        firstYearRate: scenario.firstYearRate,
        margin: scenario.margin,
      },
      context,
    });
    const timingMode = scenario.timingMode ?? sharedConfig.timingMode ?? 'general';
    const investmentHorizonMonths = scenario.investmentHorizonMonths ?? sharedConfig.investmentHorizonMonths;
    const withdrawalDate = scenario.withdrawalDate
      ?? (timingMode === 'general' && investmentHorizonMonths
        ? getWithdrawalDateFromMonths(purchaseDate, investmentHorizonMonths)
        : sharedConfig.withdrawalDate);

    return {
      ...resolvedInputs,
      initialInvestment: sharedConfig.initialInvestment,
      expectedInflation: sharedConfig.expectedInflation,
      expectedNbpRate: sharedConfig.expectedNbpRate ?? 5.25,
      customInflation: sharedConfig.customInflation,
      customNbpRate: sharedConfig.customNbpRate,
      inflationScenario: sharedConfig.inflationScenario,
      taxRate: 19,
      withdrawalDate,
      isRebought: scenario.isRebought ?? false,
      taxStrategy: scenario.taxStrategy ?? sharedConfig.taxStrategy ?? TaxStrategy.STANDARD,
      timingMode,
      investmentHorizonMonths,
    };
  }

  private generateScenarioAssumptions(
    label: string,
    inputs: Partial<BondInputs> & {
      expectedInflation?: number;
      expectedNbpRate?: number;
      customInflation?: number[];
    },
  ): string[] {
    return this.generateAssumptions(inputs).map((assumption) => `${label}: ${assumption}`);
  }
}

