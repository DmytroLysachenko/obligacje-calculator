# 06. Bond Calculation Engine

The Bond Calculation Engine is the mathematical heart of the platform. It must be deterministic, highly tested, and capable of handling complex Polish retail bond rules.

## 1. Engine Responsibilities
1.  **Accrual Logic:** Calculate how much interest is earned day-by-day or month-by-month.
2.  **Event Scheduling:** Determine when capitalization happens and when taxes are due.
3.  **Inflation Tracking:** Apply CPI data to inflation-linked bonds with the correct 2-month lag.
4.  **Redemption Simulation:** Calculate the net payout if a user withdraws at any arbitrary point in time.

## 2. The Iterative Calculation Loop

The engine calculates values using a monthly resolution (or daily for higher precision):

```pseudo
For each Month in Duration:
  1. Determine current Interest Rate for this period.
     - If Inflation-Linked: Rate = CPI[Month-2] + Margin
     - If Fixed: Rate = Constant
  2. Calculate Accrued Interest: Principal * (Rate / 12)
  3. If Capitalization Month:
     - Add Accrued Interest to Principal
     - Reset Accrued Interest to 0
  4. Record state (Gross Value, Tax Liability)
End Loop
```

## 3. Handling the "Belka" Tax
Tax is not calculated every month. It is a "deferred liability."
- **At Maturity:** `Tax = (FinalValue - InitialInvestment) * 0.19`
- **At Early Redemption:** `Tax = (CurrentValue - RedemptionFee - InitialInvestment) * 0.19`
- **Important:** Tax is rounded to 2 decimal places in favor of the tax authority (standard Polish banking practice).

## 4. The Inflation Lag Mechanic
For bonds like EDO and COI, the interest rate for a new year depends on the "Inflation for the month two months prior to the first month of the new interest period."

*Example:*
- Bond Interest Period starts: **June 1st**
- Inflation data used: **April CPI** (usually published mid-May)

## 5. Early Redemption Penalty
The penalty is a fixed amount (e.g., 2.00 PLN for EDO). 
- **The "Floor" Rule:** The penalty can never reduce the user's initial capital.
- `Payout = Max(InitialCapital, GrossValue - Penalty - Tax)`

## 6. Mathematical Precision
- **Data Type:** Use `Decimal.js` or `Big.js`. Never use standard JavaScript `Number` (floating point) for currency.
- **Rounding:** Follow the official bond prospectus rules (usually 2 or 4 decimal places depending on the step).
