import { NextRequest } from 'next/server';
import { z } from 'zod';

import { calculationService } from '@/features/bond-core/application-service';
import { BondInputs, RegularInvestmentInputs } from '@/features/bond-core/types';
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
  parseCalculationScenarioRequest,
  RegularInvestmentInputsSchema,
  RetirementPlannerPayloadSchema,
} from '@/features/bond-core/types/schemas';

import { apiHandler } from './api-handler';
import { readJsonBody } from './read-json-body';
import { okJson } from './responses';

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
    const payload = (await readJsonBody(
      req,
      scenarioSchemas[kind],
    )) as PayloadByScenarioKind[TKind];
    const request = parseCalculationScenarioRequest({ kind, payload });

    const envelope = await calculationService.calculate(request as CalculationScenarioRequest);

    return okJson(envelope);
  });
}
