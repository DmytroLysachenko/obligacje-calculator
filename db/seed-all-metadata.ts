import { db } from "./index";
import { polishBonds, taxRules, dataSeries } from "./schema";
import { BOND_DEFINITIONS } from "../features/bond-core/constants/bond-definitions";
import { InterestPayout } from "../features/bond-core/types";

async function seed() {
  console.log("🌱 [1/3] Seeding bond metadata...");
  for (const [symbol, def] of Object.entries(BOND_DEFINITIONS)) {
    const interestType = def.isInflationIndexed ? "inflation_linked" : def.isFloating ? "floating_nbp" : "fixed";
    const capFreq = def.isCapitalized ? 365 : 0;
    const payoutFreq = def.payoutFrequency === InterestPayout.MONTHLY ? 30 : def.payoutFrequency === InterestPayout.YEARLY ? 365 : 0;

    await db.insert(polishBonds).values({
      symbol,
      fullName: def.fullName.pl,
      fullNameEn: def.fullName.en,
      description: def.description.pl,
      descriptionEn: def.description.en,
      durationDays: Math.round(def.duration * 365),
      nominalValue: def.nominalValue.toString(),
      capitalizationFreqDays: capFreq,
      payoutFreqDays: payoutFreq,
      interestType: interestType as "fixed" | "floating_nbp" | "inflation_linked",
      firstYearRate: def.firstYearRate.toString(),
      baseMargin: def.margin.toString(),
      withdrawalFee: def.earlyWithdrawalFee.toString(),
      withdrawalFeeCap: true,
      rolloverDiscount: def.rebuyDiscount.toString(),
      isFamilyOnly: def.isFamilyOnly || false,
    }).onConflictDoUpdate({
      target: polishBonds.symbol,
      set: {
        fullName: def.fullName.pl,
        fullNameEn: def.fullName.en,
        description: def.description.pl,
        descriptionEn: def.description.en,
        durationDays: Math.round(def.duration * 365),
        firstYearRate: def.firstYearRate.toString(),
        baseMargin: def.margin.toString(),
        withdrawalFee: def.earlyWithdrawalFee.toString(),
        rolloverDiscount: def.rebuyDiscount.toString(),
      }
    });
  }

  console.log("🌱 [2/3] Seeding tax rules...");
  const taxLimits = [
    { year: 2023, ike: 20805, ikze: 8322 },
    { year: 2024, ike: 23472, ikze: 9388.80 },
    { year: 2025, ike: 24324, ikze: 9730.80 },
    { year: 2026, ike: 25400, ikze: 10160 },
  ];
  for (const limit of taxLimits) {
    await db.insert(taxRules).values({
      year: limit.year,
      ikeLimit: limit.ike.toString(),
      ikzeLimit: limit.ikze.toString(),
      standardTaxRate: "19.00",
      ikzePayoutTaxRate: "5.00",
    }).onConflictDoUpdate({
      target: taxRules.year,
      set: {
        ikeLimit: limit.ike.toString(),
        ikzeLimit: limit.ikze.toString(),
      }
    });
  }

  console.log("🌱 [3/3] Seeding data series metadata...");
  const series = [
    { slug: 'sp500', name: 'S&P 500 Index', category: 'index' as "macro" | "instrument" | "index" | "currency" | "commodity", unit: 'points', frequency: 'daily', dataSource: 'Stooq' },
    { slug: 'gold-usd', name: 'Gold Price (USD)', category: 'commodity' as "macro" | "instrument" | "index" | "currency" | "commodity", unit: 'USD/oz', frequency: 'daily', dataSource: 'Stooq' },
    { slug: 'wibor-3m', name: 'WIBOR 3M', category: 'macro' as "macro" | "instrument" | "index" | "currency" | "commodity", unit: '%', frequency: 'daily', dataSource: 'Stooq' },
    { slug: 'wibor-6m', name: 'WIBOR 6M', category: 'macro' as "macro" | "instrument" | "index" | "currency" | "commodity", unit: '%', frequency: 'daily', dataSource: 'Stooq' },
    { slug: 'pl-cpi', name: 'Poland Inflation (CPI)', category: 'macro' as "macro" | "instrument" | "index" | "currency" | "commodity", unit: '%', frequency: 'monthly', dataSource: 'GUS/Stooq' },
    { slug: 'nbp-ref-rate', name: 'NBP Reference Rate', category: 'macro' as "macro" | "instrument" | "index" | "currency" | "commodity", unit: '%', frequency: 'on-event', dataSource: 'NBP' }
  ];
  for (const s of series) {
    await db.insert(dataSeries).values({
      slug: s.slug,
      name: s.name,
      category: s.category,
      unit: s.unit,
      frequency: s.frequency,
      dataSource: s.dataSource,
    }).onConflictDoUpdate({
      target: dataSeries.slug,
      set: {
        name: s.name,
        category: s.category,
        unit: s.unit,
        frequency: s.frequency,
        dataSource: s.dataSource,
      }
    });
  }

  console.log("✅ [All-in-One] Seeding completed!");
}

seed().catch(console.error);
