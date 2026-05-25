import { BondType } from '@/features/bond-core/types';

const INDEXED_BOND_TYPES = new Set<BondType>([
  BondType.COI,
  BondType.EDO,
  BondType.ROS,
  BondType.ROD,
]);

const FLOATING_NBP_BOND_TYPES = new Set<BondType>([
  BondType.ROR,
  BondType.DOR,
]);

export type InflationAssumptionEffect =
  | 'coupon-and-real-value'
  | 'real-value-only';

export type NbpAssumptionEffect =
  | 'coupon-after-opening-period'
  | 'context-only';

export function isInflationIndexedBondType(bondType: BondType) {
  return INDEXED_BOND_TYPES.has(bondType);
}

export function isFloatingNbpBondType(bondType: BondType) {
  return FLOATING_NBP_BOND_TYPES.has(bondType);
}

export function getInflationAssumptionEffect(
  bondType: BondType,
): InflationAssumptionEffect {
  if (isInflationIndexedBondType(bondType)) {
    return 'coupon-and-real-value';
  }

  return 'real-value-only';
}

export function getNbpAssumptionEffect(bondType: BondType): NbpAssumptionEffect {
  if (isFloatingNbpBondType(bondType)) {
    return 'coupon-after-opening-period';
  }

  return 'context-only';
}

export function getInflationEffectMessageKey(bondType: BondType) {
  if (isInflationIndexedBondType(bondType)) {
    return 'bonds.market_assumptions.indexed_context';
  }

  if (isFloatingNbpBondType(bondType)) {
    return 'bonds.market_assumptions.floating_inflation_context';
  }

  return 'bonds.market_assumptions.real_value_context';
}

export function getNbpEffectMessageKey(bondType: BondType) {
  if (isFloatingNbpBondType(bondType)) {
    return 'bonds.market_assumptions.nbp_note';
  }

  return 'bonds.market_assumptions.nbp_context_only';
}
