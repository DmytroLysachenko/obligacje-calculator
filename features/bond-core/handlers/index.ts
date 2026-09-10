import { ScenarioKind } from '../types/scenarios';

import { HandlerData, ScenarioHandler } from './base';
import { ComparisonHandler } from './comparison';
import { OptimizerHandler } from './optimizer';
import { PortfolioSimulationHandler } from './portfolio-simulation';
import { RegularInvestmentHandler } from './regular-investment';
import { RetirementPlannerHandler } from './retirement-planner';
import { SingleBondHandler } from './single-bond';

export * from './base';
export * from './comparison';
export * from './optimizer';
export * from './portfolio-simulation';
export * from './regular-investment';
export * from './retirement-planner';
export * from './single-bond';

export class HandlerFactory {
  private handlers: Map<ScenarioKind, ScenarioHandler<unknown, unknown>> = new Map();

  constructor(data: HandlerData) {
    this.register(new SingleBondHandler(data) as unknown as ScenarioHandler<unknown, unknown>);
    this.register(
      new RegularInvestmentHandler(data) as unknown as ScenarioHandler<unknown, unknown>,
    );
    this.register(new ComparisonHandler(data) as unknown as ScenarioHandler<unknown, unknown>);
    this.register(
      new PortfolioSimulationHandler(data) as unknown as ScenarioHandler<unknown, unknown>,
    );
    this.register(new OptimizerHandler(data) as unknown as ScenarioHandler<unknown, unknown>);
    this.register(
      new RetirementPlannerHandler(data) as unknown as ScenarioHandler<unknown, unknown>,
    );
  }

  register(handler: ScenarioHandler<unknown, unknown>) {
    this.handlers.set(handler.kind, handler);
  }

  getHandler(kind: ScenarioKind): ScenarioHandler<unknown, unknown> {
    const handler = this.handlers.get(kind);
    if (!handler) {
      throw new Error(`Unsupported scenario kind: ${kind}`);
    }
    return handler;
  }
}
