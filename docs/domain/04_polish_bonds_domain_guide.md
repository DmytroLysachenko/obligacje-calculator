# 04. Polish Bonds Domain Guide

This document encodes the business logic and domain rules for Polish Treasury Bonds (Obligacje Skarbowe).

## 1. Core Bond Types (Retail)

| Code | Duration | Interest Type | Best For |
| :--- | :--- | :--- | :--- |
| **OTS** | 3 Months | Fixed | Very short-term liquidity |
| **ROR** | 1 Year | Floating (NBP Rate) | Hedging against interest rate hikes |
| **DOR** | 2 Years | Floating (NBP Rate) | Mid-term safety with rate adjustment |
| **TOS** | 3 Years | Fixed | Predictability over 3 years |
| **COI** | 4 Years | Inflation-Linked | Protection against CPI + Margin |
| **EDO** | 10 Years | Inflation-Linked | Long-term wealth building / Retirement |
| **ROS** | 6 Years | Family (Inflation) | Parents (requires 800+ eligibility) |
| **ROD** | 12 Years | Family (Inflation) | Parents (requires 800+ eligibility) |

## 2. Interest Mechanics

### Fixed Rate (OTS, TOS)
- Interest is set at purchase and does not change.
- **OTS:** Simple interest paid at maturity.
- **TOS:** Annual capitalization (interest added to principal).

### Floating - NBP Linked (ROR, DOR)
- Interest = NBP Reference Rate + Margin (if applicable).
- Updated monthly (ROR) or periodically.

### Inflation-Linked (COI, EDO, ROS, ROD)
- **Year 1:** Fixed rate set in the prospectus.
- **Year 2+:** Interest = CPI (Inflation) + Margin.
- **The Lag:** The CPI used is typically from 2 months prior to the start of the new interest period.

## 3. Capitalization vs. Payout
- **Capitalization (EDO, TOS, ROS, ROD):** Interest is added to the principal. You earn "interest on interest" next year.
- **Annual Payout (COI):** Interest is paid out to your cash account every year. It does not compound automatically within the bond.

## 4. Taxation: The "Belka" Tax
- A **19% tax** on capital gains.
- For bonds, it is calculated and deducted automatically by the brokerage (PKO BP / Pekao) at payout or redemption.
- *Calculation:* `(Interest - Early Redemption Fee) * 0.19`.

## 5. Early Redemption (Wykup Przedterminowy)
Users can withdraw money before maturity, but they pay a fee.
- **OTS:** No interest earned if withdrawn early.
- **ROR/DOR:** Usually ~0.70 PLN per bond.
- **COI:** ~0.70 PLN per bond.
- **EDO:** ~2.00 PLN per bond.
- **Crucial Rule:** The fee cannot exceed the total interest earned. Your initial capital is protected.

## 6. Rollover Discount (Zamiana)
When a bond matures, you can "exchange" it for new bonds.
- You get a discount on the new purchase price (e.g., 99.90 PLN instead of 100.00 PLN).
- This increases the effective yield of the next investment.

## 7. Purchase Limits
- Most bonds have no limit (up to millions of PLN).
- Family bonds (ROS/ROD) are limited to the total amount of 800+ benefits received.
