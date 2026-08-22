const BOND_UNIT_PRICE = 100;
export const MAX_BOND_QUANTITY = 1_000;

function normalizeBondQuantity(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > MAX_BOND_QUANTITY) return null;
  return value;
}

export function bondQuantityFromInvestment(value: number) {
  return Math.min(MAX_BOND_QUANTITY, Math.max(1, Math.round(value / BOND_UNIT_PRICE)));
}

export function investmentFromBondQuantity(value: number) {
  const quantity = normalizeBondQuantity(value);
  return quantity === null ? null : quantity * BOND_UNIT_PRICE;
}
