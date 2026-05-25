import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculationService } from '@/features/bond-core/application-service';
import {
  BondOptimizerPayload,
  CalculationScenarioRequest,
  RetirementPlannerPayload,
  ScenarioKind,
} from '@/features/bond-core/types/scenarios';
import {
  BondComparisonScenarioPayloadSchema,
  BondInputsSchema,
  BondOptimizerPayloadSchema,
  RegularInvestmentInputsSchema,
  RetirementPlannerPayloadSchema,
} from '@/features/bond-core/types/schemas';
import { BondInputs, RegularInvestmentInputs } from '@/features/bond-core/types';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from './api-handler';

type PayloadByScenarioKind = {
  [ScenarioKind.SINGLE_BOND]: BondInputs;
  [ScenarioKind.REGULAR_INVESTMENT]: RegularInvestmentInputs;
  [ScenarioKind.BOND_COMPARISON]: z.infer<typeof BondComparisonScenarioPayloadSchema>;
  [ScenarioKind.BOND_OPTIMIZER]: BondOptimizerPayload;
  [ScenarioKind.RETIREMENT_PLANNER]: RetirementPlannerPayload;
};

const scenarioSchemas = {
  [ScenarioKind.SINGLE_BOND]: BondInputsSchema,
  [ScenarioKind.REGULAR_INVESTMENT]: RegularInvestmentInputsSchema,
  [ScenarioKind.BOND_COMPARISON]: BondComparisonScenarioPayloadSchema,
  [ScenarioKind.BOND_OPTIMIZER]: BondOptimizerPayloadSchema,
  [ScenarioKind.RETIREMENT_PLANNER]: RetirementPlannerPayloadSchema,
} as const;

export function createCalculationRoute<
  TKind extends keyof PayloadByScenarioKind & CalculationScenarioRequest['kind'],
>(kind: TKind) {
  return apiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const payload = scenarioSchemas[kind].parse(body) as PayloadByScenarioKind[TKind];

    const envelope = await calculationService.calculate({
      kind,
      payload,
    } as CalculationScenarioRequest);

    return NextResponse.json(createSuccessResponse(envelope));
  });
}
