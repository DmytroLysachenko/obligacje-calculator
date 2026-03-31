import { db } from "@/db";
import { polishBonds } from "@/db/schema";
import "dotenv/config";

async function seedBonds() {
  const bonds = [
    {
      symbol: "OTS",
      fullName: "Oszczędnościowe Trzymiesięczne Stałooprocentowane",
      durationDays: 90,
      nominalValue: "100.00",
      capitalizationFreqDays: 0,
      payoutFreqDays: 90,
      interestType: "fixed" as const,
      firstYearRate: "3.00",
      baseMargin: "0.00",
      withdrawalFee: "0.00",
      withdrawalFeeCap: true,
      rolloverDiscount: "0.10",
      isFamilyOnly: false,
    },
    {
      symbol: "ROR",
      fullName: "Roczne Oszczędnościowe Referencyjne",
      durationDays: 365,
      nominalValue: "100.00",
      capitalizationFreqDays: 0,
      payoutFreqDays: 30, // Monthly payout
      interestType: "floating_nbp" as const,
      firstYearRate: "5.75", // Same as NBP for now
      baseMargin: "0.00",
      withdrawalFee: "0.70",
      withdrawalFeeCap: true,
      rolloverDiscount: "0.10",
      isFamilyOnly: false,
    },
    {
      symbol: "DOR",
      fullName: "Dwuletnie Oszczędnościowe Referencyjne",
      durationDays: 730,
      nominalValue: "100.00",
      capitalizationFreqDays: 0,
      payoutFreqDays: 30, // Monthly payout
      interestType: "floating_nbp" as const,
      firstYearRate: "5.90",
      baseMargin: "0.15",
      withdrawalFee: "0.70",
      withdrawalFeeCap: true,
      rolloverDiscount: "0.10",
      isFamilyOnly: false,
    },
    {
      symbol: "TOS",
      fullName: "Trzyletnie Oszczędnościowe Stałooprocentowane",
      durationDays: 1095,
      nominalValue: "100.00",
      capitalizationFreqDays: 365,
      payoutFreqDays: 0, // Payout at maturity
      interestType: "fixed" as const,
      firstYearRate: "6.20",
      baseMargin: "0.00",
      withdrawalFee: "0.70",
      withdrawalFeeCap: true,
      rolloverDiscount: "0.10",
      isFamilyOnly: false,
    },
    {
      symbol: "COI",
      fullName: "Czteroletnie Oszczędnościowe Indeksowane",
      durationDays: 1460,
      nominalValue: "100.00",
      capitalizationFreqDays: 0,
      payoutFreqDays: 365, // Yearly payout
      interestType: "inflation_linked" as const,
      firstYearRate: "6.50",
      baseMargin: "1.50",
      withdrawalFee: "0.70",
      withdrawalFeeCap: true,
      rolloverDiscount: "0.10",
      isFamilyOnly: false,
    },
    {
      symbol: "EDO",
      fullName: "Emerytalne Dziesięcioletnie Oszczędnościowe",
      durationDays: 3650,
      nominalValue: "100.00",
      capitalizationFreqDays: 365,
      payoutFreqDays: 0, // Payout at maturity
      interestType: "inflation_linked" as const,
      firstYearRate: "6.75",
      baseMargin: "2.00",
      withdrawalFee: "2.00",
      withdrawalFeeCap: true,
      rolloverDiscount: "0.10",
      isFamilyOnly: false,
    },
    {
      symbol: "ROS",
      fullName: "Rodzinne Sześcioletnie Oszczędnościowe",
      durationDays: 2190,
      nominalValue: "100.00",
      capitalizationFreqDays: 365,
      payoutFreqDays: 0,
      interestType: "inflation_linked" as const,
      firstYearRate: "6.75",
      baseMargin: "2.00",
      withdrawalFee: "0.70",
      withdrawalFeeCap: true,
      rolloverDiscount: "0.10",
      isFamilyOnly: true,
    },
    {
      symbol: "ROD",
      fullName: "Rodzinne Dwunastoletnie Oszczędnościowe",
      durationDays: 4380,
      nominalValue: "100.00",
      capitalizationFreqDays: 365,
      payoutFreqDays: 0,
      interestType: "inflation_linked" as const,
      firstYearRate: "7.00",
      baseMargin: "2.50",
      withdrawalFee: "2.00",
      withdrawalFeeCap: true,
      rolloverDiscount: "0.10",
      isFamilyOnly: true,
    }
  ];

  console.log("[Seed] Seeding production bond types...");

  for (const b of bonds) {
    try {
      await db.insert(polishBonds).values({
        ...b,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: polishBonds.symbol,
        set: {
          ...b,
          updatedAt: new Date(),
        }
      });
      console.log(`[Seed] Seeded/Updated: ${b.symbol}`);
    } catch (error) {
      console.error(`[Seed] Failed to seed ${b.symbol}:`, error);
    }
  }

  console.log("[Seed] Bond types seeding completed.");
}

seedBonds().then(() => process.exit(0));
