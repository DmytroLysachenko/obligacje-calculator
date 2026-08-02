/**
 * Tracks the current calculation independently from React render timing.
 * Starting a newer request makes earlier resolutions observational only.
 */
export class CalculationSessionExecution {
  private epoch = 0;

  start() {
    this.epoch += 1;
    return this.epoch;
  }

  isCurrent(epoch: number) {
    return this.epoch === epoch;
  }

  invalidate() {
    this.epoch += 1;
  }
}
