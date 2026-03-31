# 20. Detailed Data Schemas

This document defines the structured data models for Polish Treasury Bonds and general investment instruments. To ensure consistency across the platform, all internal calculations will transition to a **daily-basis engine** to unify different capitalization and payout frequencies.

## 1. Polish Bonds Schema (`polish_bonds`)

This table stores the specific DNA of each bond type. It allows the calculation engine to handle EDO, COI, ROR, and others through a single logic flow.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key. |
| `symbol` | String | e.g., "EDO", "COI", "ROR". |
| `full_name` | String | e.g., "Emerytalne Dziesięcioletnie Oszczędnościowe". |
| `duration_days` | Integer | Total bond life in days (unifies years/months). |
| `nominal_value` | Decimal | Usually 100.00 PLN. |
| `capitalization_freq_days`| Integer | 0 if no capitalization, 365 for annual (EDO). |
| `payout_freq_days` | Integer | 0 if at maturity, 365 for annual coupons (COI). |
| `interest_type` | Enum | `fixed`, `floating_nbp`, `inflation_linked`. |
| `base_margin` | Decimal | Fixed margin above inflation/NBP (e.g., 1.50). |
| `withdrawal_fee` | Decimal | Penalty per bond for early exit (e.g., 2.00). |
| `withdrawal_fee_cap` | Boolean | If true, fee cannot exceed earned interest. |
| `rollover_discount` | Decimal | Discount per bond when rebuying (e.g., 0.10). |
| `is_family_only` | Boolean | Requires 800+ eligibility (ROS, ROD). |

## 2. Investment Instruments Schema (`investment_instruments`)

A high-level table used for comparing different asset classes (Stocks, Crypto, Gold, Bonds).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key. |
| `category` | Enum | `bond`, `equity`, `commodity`, `crypto`. |
| `ticker` | String | e.g., "BTC", "SPX", "GOLD". |
| `display_name` | String | User-friendly name. |
| `risk_score` | Integer | 1-5 scale. |
| `data_source` | String | `nbp`, `stooq`, `gus`. |
| `currency` | String | `PLN`, `USD`, etc. |

## 3. Price History Schema (`instrument_price_history`)

Stores time-series data for charts and backtesting.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | BigInt | Primary Key. |
| `instrument_id` | FK | Links to `investment_instruments.id`. |
| `date` | Date | The daily/monthly snapshot date. |
| `price_close` | Decimal | Closing price or index value. |
| `inflation_value` | Decimal | Optional: CPI at that date if applicable. |

## 4. Architectural Decision: Daily-Basis Unification

To solve the complexity of comparing a monthly-payout bond (ROR) with a yearly-capitalized bond (EDO), the engine will operate on a **Daily Step**:

1.  **Daily Accrual:** `DailyInterest = (AnnualRate / 365) * CurrentPrincipal`.
2.  **Event Triggering:** On each day, the engine checks:
    - `Is (DaysElapsed % capitalization_freq_days) == 0?` -> Compounding happens.
    - `Is (DaysElapsed % payout_freq_days) == 0?` -> Cash payout happens.
3.  **Liquidity Modeling:** At any day `D`, the "Early Withdrawal Value" is calculated as `GrossValue(D) - (WithdrawalFee * BondCount) - BelkaTax`.

This daily granularity allows for perfectly aligned charts when comparing two different instruments over the same date range.
