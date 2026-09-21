/** Integer-grosz binary search; callers supply the authoritative simulation. */
export async function solveRequiredRecurringContribution({
  target,
  calculate,
  maxContribution = 1_000_000,
}: {
  target: number;
  calculate: (contribution: number) => Promise<number>;
  maxContribution?: number;
}) {
  if (target <= 0) return { contribution: 0, achieved: 0, reachable: true };
  let low = 0;
  let high = 100;
  while (high < maxContribution && (await calculate(high)) < target) {
    low = high;
    high *= 2;
  }
  if ((await calculate(high)) < target)
    return { contribution: null, achieved: await calculate(high), reachable: false };
  while (high - low > 0.01) {
    const middle = Math.round((low + high) * 50) / 100;
    if ((await calculate(middle)) >= target) high = middle;
    else low = middle;
  }
  return { contribution: high, achieved: await calculate(high), reachable: true };
}
