# 06. Bond Calculation Engine

The Bond Calculation Engine is the mathematical heart of the platform. It is deterministic, modular, and highly tested using `Decimal.js` for financial precision.

## 1. Engine Architecture

The engine has been refactored into specialized modules to improve maintainability:

-   **`calculations.ts`**: The main entry point coordinating the calculation flow.
-   **`engine/interest-rates.ts`**: Logic for determining the annual interest rate for a given period, including support for historical inflation lookups with a 2-month lag.
-   **`engine/tax-logic.ts`**: Handles the "Belka" tax calculation, supporting both standard precision and official rounding rules.
-   **`engine/redemption-engine.ts`**: Implements early withdrawal fees and rules (e.g., fee cannot exceed earned interest).

## 2. Mathematical Precision

-   **Library:** All currency and interest accrual logic uses `Decimal.js`.
-   **Configuration:** 20 decimal places of precision with `ROUND_HALF_UP`.
-   **Return Types:** The final results are converted back to standard `number` types for UI compatibility, but only at the very end of the calculation pipeline.

## 3. Key Domain Rules Implemented

-   **Inflation Lag:** Indexed bonds (EDO, COI) use the annual inflation rate published 2 months prior to the interest period start.
-   **Tax Rounding:** Supports Article 30a rules where the taxable base and tax amount are rounded to the nearest full zloty (when enabled).
-   **Fee Floor:** For retail bonds, the early withdrawal fee is capped at the total accumulated interest to ensure the nominal capital is protected.
-   **OTS Special Case:** 3-month fixed bonds lose all interest upon early withdrawal.

## 4. Input Validation

All inputs are strictly validated using **Zod** schemas (`BondInputsSchema`, `RegularInvestmentInputsSchema`) at the API and internal logic boundaries.
