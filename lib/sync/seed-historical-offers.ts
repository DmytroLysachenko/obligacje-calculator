import { db } from "@/db";
import { polishBonds, bondSeries } from "@/db/schema";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function seedHistorical() {
  console.log("[Seed] Seeding historical bond offers...");

  // 1. Get Bond Type IDs
  const edo = await db.query.polishBonds.findFirst({ where: eq(polishBonds.symbol, "EDO") });
  const coi = await db.query.polishBonds.findFirst({ where: eq(polishBonds.symbol, "COI") });

  if (!edo || !coi) {
    console.error("Bond types EDO/COI not found. Seed production bonds first.");
    return;
  }

  const historicalOffers = [
    {
      bondTypeId: edo.id,
      seriesCode: "EDO0530",
      emissionMonth: "2020-05-01",
      sellStartDate: "2020-05-01",
      sellEndDate: "2020-05-31",
      maturityDate: "2030-05-01",
      firstYearRate: "1.70",
      baseMargin: "1.00",
    },
    {
      bondTypeId: edo.id,
      seriesCode: "EDO1032",
      emissionMonth: "2022-10-01",
      sellStartDate: "2022-10-01",
      sellEndDate: "2022-10-31",
      maturityDate: "2032-10-01",
      firstYearRate: "7.25",
      baseMargin: "1.25",
    },
    {
      bondTypeId: coi.id,
      seriesCode: "COI0524",
      emissionMonth: "2020-05-01",
      sellStartDate: "2020-05-01",
      sellEndDate: "2020-05-31",
      maturityDate: "2024-05-01",
      firstYearRate: "1.30",
      baseMargin: "0.75",
    },
    {
      bondTypeId: coi.id,
      seriesCode: "COI1026",
      emissionMonth: "2022-10-01",
      sellStartDate: "2022-10-01",
      sellEndDate: "2022-10-31",
      maturityDate: "2026-10-01",
      firstYearRate: "7.00",
      baseMargin: "1.00",
    }
  ];

  for (const offer of historicalOffers) {
    try {
      await db.insert(bondSeries).values(offer).onConflictDoUpdate({
        target: bondSeries.seriesCode,
        set: offer
      });
      console.log(`[Seed] Seeded historical series: ${offer.seriesCode}`);
    } catch (error) {
      console.error(`[Seed] Failed to seed ${offer.seriesCode}:`, error);
    }
  }

  console.log("[Seed] Historical offers seeding completed.");
}

seedHistorical().then(() => process.exit(0));
