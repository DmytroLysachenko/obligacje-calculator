# 06. Bond Calculation Engine

The Bond Calculation Engine is the mathematical heart of the platform. It is deterministic, modular, and highly tested using `Decimal.js` for financial precision.

## 1. Engine Architecture

The engine has been refactored into focused, specialized modules following the 2026 refactoring plan:

-   **`application-service.ts`**: The application layer entry point coordinating input validation, historical data enrichment, and results assembly.
-   **`calculations.ts`**: The main domain entry point orchestrating the calculation flow.
-   **`engine/input-normalization.ts`**: Standardizes and validates input dates and parameters.
-   **`engine/timeline-builder.ts`**: Generates the discrete periods for the bond lifecycle.
-   **`engine/accrual.ts`**: Pure logic for interest accrual within a single period.
-   **`engine/rate-resolution.ts`**: Logic for determining the annual interest rate for a given period, including support for historical inflation lookups with a 2-month lag.
-   **`engine/tax-settlement.ts`**: Handles the "Belka" tax calculation with official rounding rules.
-   **`engine/redemption.ts`**: Implements early withdrawal fees and fee capping.
-   **`engine/rollover.ts`**: Manages the logic for reinvesting matured capital into subsequent cycles.
-   **`engine/real-return.ts`**: Standardizes real-value and CAGR (Compound Annual Growth Rate) calculations.
-   **`engine/result-assembly.ts`**: Formats raw calculation results into the public-facing DTOs and envelopes.
-   **`engine/inflation.ts`**: Specialized logic for cumulative inflation tracking and lag resolution.
-   **`engine/historical-data.ts`**: Utilities for looking up lagged historical values in the enriched data map.

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
