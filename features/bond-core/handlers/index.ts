import { ScenarioKind } from '../types/scenarios';
import { ScenarioHandler } from './base';
import { SingleBondHandler } from './single-bond';
import { RegularInvestmentHandler } from './regular-investment';
import { ComparisonHandler } from './comparison';
import { PortfolioSimulationHandler } from './portfolio-simulation';
import { OptimizerHandler } from './optimizer';
import { RetirementPlannerHandler } from './retirement-planner';

export * from './base';
export * from './single-bond';
export * from './regular-investment';
export * from './comparison';
export * from './portfolio-simulation';
export * from './optimizer';
export * from './retirement-planner';

export class HandlerFactory {
  private static handlers: Map<ScenarioKind, ScenarioHandler<unknown, unknown>> = new Map();

  static {
    this.register(new SingleBondHandler() as unknown as ScenarioHandler<unknown, unknown>);
    this.register(new RegularInvestmentHandler() as unknown as ScenarioHandler<unknown, unknown>);
    this.register(new ComparisonHandler() as unknown as ScenarioHandler<unknown, unknown>);
    this.register(new PortfolioSimulationHandler() as unknown as ScenarioHandler<unknown, unknown>);
    this.register(new OptimizerHandler() as unknown as ScenarioHandler<unknown, unknown>);
    this.register(new RetirementPlannerHandler() as unknown as ScenarioHandler<unknown, unknown>);
  }

  static register(handler: ScenarioHandler<unknown, unknown>) {
    this.handlers.set(handler.kind, handler);
  }

  static getHandler(kind: ScenarioKind): ScenarioHandler<unknown, unknown> {
    const handler = this.handlers.get(kind);
    if (!handler) {
      throw new Error(`Unsupported scenario kind: ${kind}`);
    }
    return handler;
  }
}
