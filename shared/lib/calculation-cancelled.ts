/** Explicit non-error terminal signal for an aborted calculation transport. */
export class CalculationCancelled extends Error {
  constructor() {
    super('Calculation cancelled');
    this.name = 'CalculationCancelled';
  }
}
