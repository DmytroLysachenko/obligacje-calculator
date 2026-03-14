# Polish Retail Treasury Bonds (2026)

This document describes the characteristics of Polish retail Treasury bonds available in the current offer.

## General Rules
- **Face Value:** 100 PLN per bond.
- **Taxation:** 19% capital gains tax ("Belka tax") applies to interest.
- **Early Redemption:** Possible for all bonds (except OTS, where you lose all interest), subject to a fee per bond.

## Bond Types

| Symbol | Maturity | Interest Type | Capitalization | Payout | Early Fee |
|--------|----------|---------------|----------------|--------|-----------|
| **OTS** | 3 months | Fixed | No | Maturity | No interest |
| **ROR** | 1 year | Variable (NBP) | No | Monthly | 0.50 PLN |
| **DOR** | 2 years | Variable (NBP) | No | Monthly | 0.70 PLN |
| **TOS** | 3 years | Fixed | Yes (Yearly) | Maturity | 1.00 PLN |
| **COI** | 4 years | Inflation-indexed | No | Yearly | 2.00 PLN |
| **ROS** | 6 years | Inflation-indexed | Yes (Yearly) | Maturity | 2.00 PLN |
| **EDO** | 10 years | Inflation-indexed | Yes (Yearly) | Maturity | 3.00 PLN |
| **ROD** | 12 years | Inflation-indexed | Yes (Yearly) | Maturity | 2.00 PLN |

---

## Detailed Characteristics

### 1. OTS (3-month)
- **Fixed rate:** ~2.50% (annualized).
- **Early redemption:** Lose all interest.

### 2. ROR (1-year) & DOR (2-year)
- **Variable rate:** NBP reference rate + margin.
- **ROR Margin:** 0.00%
- **DOR Margin:** ~0.15% (varies)
- **Payout:** Monthly interest transfer to bank account.

### 3. TOS (3-year)
- **Fixed rate:** ~4.65%
- **Capitalization:** Interest is added to the principal every year.
- **Payout:** At maturity (Principal + compounded interest).

### 4. COI (4-year)
- **Year 1:** Fixed rate (~5.00%).
- **Years 2-4:** CPI Inflation + Margin (~1.25%).
- **Payout:** Interest paid out every year.

### 5. EDO (10-year)
- **Year 1:** Fixed rate (~5.60%).
- **Years 2-10:** CPI Inflation + Margin (~2.00%).
- **Capitalization:** Interest compounds yearly.
- **Payout:** At maturity.

---

## Inflation-Indexed Calculation Logic
For COI, EDO, ROS, ROD:
- **Interest Rate (Year N > 1)** = CPI (last 12 months) + Margin.
- **Capitalization:** If enabled, `New Principal = Old Principal * (1 + Rate)`.
- **Taxation:** 19% is deducted either annually (if paid out) or at the end (if capitalized).

## Early Redemption Example (EDO)
- Investment: 10,000 PLN (100 bonds).
- Value after 2.5 years: 11,100 PLN.
- Fee: 100 bonds * 3.00 PLN = 300 PLN.
- Final Payout: 11,100 - 300 = 10,800 PLN.
