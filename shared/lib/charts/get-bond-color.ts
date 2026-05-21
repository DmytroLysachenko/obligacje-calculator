import { BondType } from "@/features/bond-core/types";

export const BOND_COLORS: Record<BondType, string> = {
  [BondType.OTS]: '#94a3b8', // Slate
  [BondType.ROR]: '#3b82f6', // Blue
  [BondType.DOR]: '#0ea5e9', // Sky
  [BondType.TOS]: '#8b5cf6', // Violet
  [BondType.COI]: '#10b981', // Emerald
  [BondType.ROS]: '#f43f5e', // Rose
  [BondType.EDO]: '#f59e0b', // Amber
  [BondType.ROD]: '#ec4899', // Pink
};

export const getBondColor = (type: string): string => {
  return BOND_COLORS[type as BondType] || '#64748b';
};