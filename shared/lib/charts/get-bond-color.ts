import { BondType } from '@/features/bond-core/types';

export const BOND_COLORS: Record<BondType, string> = {
  [BondType.OTS]: '#64748b', // Slate
  [BondType.ROR]: '#16a34a', // Green
  [BondType.DOR]: '#0ea5e9', // Sky
  [BondType.TOS]: '#8b5cf6', // Violet
  [BondType.COI]: '#0891b2', // Cyan
  [BondType.ROS]: '#db2777', // Rose
  [BondType.EDO]: '#dc2626', // Red
  [BondType.ROD]: '#9333ea', // Purple
};

export const getBondColor = (type: string): string => {
  return BOND_COLORS[type as BondType] || '#64748b';
};
