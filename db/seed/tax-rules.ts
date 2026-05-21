import {db} from '../index';
import {taxRules} from '../schema';

const taxLimits = [
  {year: 2023, ike: 20805, ikze: 8322},
  {year: 2024, ike: 23472, ikze: 9388.8},
  {year: 2025, ike: 24324, ikze: 9730.8},
  {year: 2026, ike: 25400, ikze: 10160},
] as const;

export async function seedTaxRules() {
  for (const limit of taxLimits) {
    await db.insert(taxRules).values({
      year: limit.year,
      ikeLimit: limit.ike.toString(),
      ikzeLimit: limit.ikze.toString(),
      standardTaxRate: '19.00',
      ikzePayoutTaxRate: '5.00',
    }).onConflictDoUpdate({
      target: taxRules.year,
      set: {
        ikeLimit: limit.ike.toString(),
        ikzeLimit: limit.ikze.toString(),
      },
    });
  }

  return taxLimits.length;
}
