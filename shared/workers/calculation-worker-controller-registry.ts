/**
 * Bounds the worker's in-flight transports. A browser tab can otherwise grow
 * a module-level controller map indefinitely by starting requests faster than
 * network completion. Rejection is explicit so callers can fall back to the
 * ordinary HTTP transport.
 */
export class CalculationWorkerControllerRegistry {
  private readonly controllers = new Map<string, AbortController>();

  constructor(private readonly maximumActive = 16) {}

  start(id: string) {
    if (this.controllers.size >= this.maximumActive) return null;
    const controller = new AbortController();
    this.controllers.set(id, controller);
    return controller;
  }

  abort(id: string) {
    const controller = this.controllers.get(id);
    if (!controller) return false;
    controller.abort();
    this.controllers.delete(id);
    return true;
  }

  finish(id: string) {
    this.controllers.delete(id);
  }

  get size() {
    return this.controllers.size;
  }
}
