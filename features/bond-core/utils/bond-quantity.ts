export const BOND_UNIT_PRICE = 100;
export const MAX_BOND_QUANTITY = 1_000;

export function normalizeBondQuantity(value: number) {
  if (!Number.isFinite(value)) return null;
  return Math.min(MAX_BOND_QUANTITY, Math.max(1, Math.trunc(value)));
}

export function bondQuantityFromInvestment(value: number) {
  return Math.min(MAX_BOND_QUANTITY, Math.max(1, Math.round(value / BOND_UNIT_PRICE)));
}

export function investmentFromBondQuantity(value: number) {
  const quantity = normalizeBondQuantity(value);
  return quantity === null ? null : quantity * BOND_UNIT_PRICE;
}
