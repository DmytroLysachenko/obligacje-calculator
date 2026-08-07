import { CalculationCancelled } from './calculation-cancelled';
import { CalculationSessionExecution } from './calculation-session-execution';

export type CalculationWorkflowOutcome<TResult> =
  | { kind: 'committed'; result: TResult }
  | { kind: 'cancelled' }
  | { kind: 'superseded'; result?: TResult };

export interface CalculationWorkflowTransitions<TInputs, TResult> {
  start(): void;
  succeed(inputs: TInputs, result: TResult): void;
  fail(error: Error): void;
  cancel(): void;
}

export interface CalculationWorkflowDependencies<TInputs, TResult> {
  transitions: CalculationWorkflowTransitions<TInputs, TResult>;
  isCancellation?: (error: unknown) => boolean;
}

/**
 * Owns calculation request epochs and the only legal terminal transitions.
 * React hooks provide state storage; this module makes stale/cancelled work
 * observational only, so it can never overwrite a later committed snapshot.
 */
export class CalculatorSessionWorkflow<TInputs, TResult> {
  private readonly execution = new CalculationSessionExecution();
  private readonly isCancellation: (error: unknown) => boolean;

  constructor(private readonly dependencies: CalculationWorkflowDependencies<TInputs, TResult>) {
    this.isCancellation =
      dependencies.isCancellation ?? ((error) => error instanceof CalculationCancelled);
  }

  invalidate() {
    this.execution.invalidate();
  }

  cancel() {
    this.execution.invalidate();
    this.dependencies.transitions.cancel();
  }

  async run(
    inputs: TInputs,
    calculate: (inputs: TInputs) => Promise<TResult>,
  ): Promise<CalculationWorkflowOutcome<TResult>> {
    const epoch = this.execution.start();
    this.dependencies.transitions.start();

    try {
      const result = await calculate(inputs);
      if (!this.execution.isCurrent(epoch)) return { kind: 'superseded', result };

      this.dependencies.transitions.succeed(inputs, result);
      return { kind: 'committed', result };
    } catch (error) {
      if (this.isCancellation(error)) {
        if (this.execution.isCurrent(epoch)) this.dependencies.transitions.cancel();
        return this.execution.isCurrent(epoch) ? { kind: 'cancelled' } : { kind: 'superseded' };
      }

      if (!this.execution.isCurrent(epoch)) return { kind: 'superseded' };

      const normalizedError = error instanceof Error ? error : new Error(String(error));
      this.dependencies.transitions.fail(normalizedError);
      throw error;
    }
  }
}
