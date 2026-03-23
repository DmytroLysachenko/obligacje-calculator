"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { userPortfolios, userInvestmentLots } from "@/db/schema";
import { BondInputs } from "@/features/bond-core/types";
import { eq } from "drizzle-orm";

export async function saveBondScenario(inputs: BondInputs) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in to save scenarios.");
  }

  // Find or create a default portfolio for the user
  let portfolio = await db.query.userPortfolios.findFirst({
    where: eq(userPortfolios.userId, session.user.id),
  });

  if (!portfolio) {
    const [newPortfolio] = await db.insert(userPortfolios).values({
      userId: session.user.id,
      name: "My Bond Simulations",
      description: "Auto-generated portfolio for saved scenarios",
    }).returning();
    portfolio = newPortfolio;
  }

  // Insert the investment lot scenario
  const [lot] = await db.insert(userInvestmentLots).values({
    portfolioId: portfolio.id,
    bondType: inputs.bondType,
    purchaseDate: new Date(inputs.purchaseDate).toISOString().split('T')[0],
    amount: inputs.initialInvestment.toString(),
    isRebought: inputs.isRebought,
    notes: `Duration: ${inputs.duration}Y. Target: ${inputs.savingsGoal || 'None'}`,
  }).returning();

  return { success: true, lot };
}
