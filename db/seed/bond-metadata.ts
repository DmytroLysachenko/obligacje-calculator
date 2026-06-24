import { BOND_DEFINITIONS } from '../../features/bond-core/constants/bond-definitions';
import { BondType } from '../../features/bond-core/types';
import { db } from '../index';
import { polishBonds } from '../schema';

export async function seedBondMetadata() {
  let bondCount = 0;

  for (const bondType of Object.values(BondType)) {
    const definition = BOND_DEFINITIONS[bondType];
    const interestType = definition.isInflationIndexed
      ? 'inflation_linked'
      : definition.isFloating
        ? 'floating_nbp'
        : 'fixed';

    await db
      .insert(polishBonds)
      .values({
        symbol: bondType,
        fullName: definition.fullName.pl,
        durationDays: Math.round(definition.duration * 365),
        nominalValue: '100.00',
        interestType: interestType as 'fixed' | 'floating_nbp' | 'inflation_linked',
        firstYearRate: definition.firstYearRate.toString(),
        baseMargin: definition.margin.toString(),
        withdrawalFee: definition.earlyWithdrawalFee.toString(),
        isFamilyOnly: bondType === BondType.ROS || bondType === BondType.ROD,
      })
      .onConflictDoUpdate({
        target: polishBonds.symbol,
        set: {
          fullName: definition.fullName.pl,
          firstYearRate: definition.firstYearRate.toString(),
          baseMargin: definition.margin.toString(),
          updatedAt: new Date(),
        },
      });
    bondCount++;
  }

  return bondCount;
}
