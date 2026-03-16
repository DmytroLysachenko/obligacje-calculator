# 10. Savings & Retirement Planner

The Retirement Planner is a high-level module that uses the Bond and Market engines to help users achieve specific life goals.

## 1. The Planning Workflow
Instead of starting with an instrument, the user starts with a **Goal**:
1.  **Objective:** "I want to retire in 20 years" or "I need 200k for a house."
2.  **Target Amount:** Defined in "Today's Purchasing Power" (to account for inflation).
3.  **Monthly Contribution:** How much the user can realistically save.
4.  **Risk Profile:** How much volatility the user can stomach.

## 2. The Recommendation Engine
The system suggests a "Portfolio Mix" based on the horizon:
- **Horizon < 3 years:** 100% Short-term Bonds (OTS/ROR).
- **Horizon 3-10 years:** Mix of EDO Bonds and Gold.
- **Horizon > 10 years:** Core EDO Bonds + S&P 500 for growth.

## 3. Dealing with Inflation in Planning
The most important feature of the planner is the **Inflation Toggle**:
- **Nominal View:** Shows the huge numbers (e.g., "You will have 2,000,000 PLN").
- **Real View:** Shows what that money can actually buy in today's terms (e.g., "This is worth 800,000 PLN today").
- This prevents the "Inflation Illusion" that leads to under-saving.

## 4. Scenario Analysis
The planner generates three paths:
- **Conservative:** High bond allocation, low expected equity growth.
- **Moderate:** Balanced allocation.
- **Optimistic:** Higher equity allocation, historical best-case growth.

## 5. Required Contribution Calculator
If the user's current savings rate is insufficient to reach the goal, the system calculates the **Gap**:
- "To reach your goal, you need to increase your monthly contribution by **450 PLN** or extend your horizon by **4 years**."

## 6. Retirement Withdrawal Simulation
Once the target is reached, the planner simulates the "Withdrawal Phase":
- Using the **4% Rule** or specific Bond Payouts (COI coupons).
- Showing how long the capital will last under different market conditions.
