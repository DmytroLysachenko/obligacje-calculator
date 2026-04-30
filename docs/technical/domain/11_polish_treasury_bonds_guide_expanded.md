
# 11. Polish Treasury Bonds Guide Expanded

**Version:** based on the retail savings-bond offer available in **March 2026**.  
**Scope:** this file covers the **current retail bond types in the official Polish savings-bond offer**:
- OTS — 3-month
- ROR — 1-year
- DOR — 2-year
- TOS — 3-year
- COI — 4-year
- EDO — 10-year
- ROS — 6-year family bonds
- ROD — 12-year family bonds

This guide is written for a person with **no investing experience** and also tries to describe the products in a **strictly mathematical way**.

---

# 1. What these bonds are

When you buy a Polish Treasury savings bond, you lend money to the Polish State Treasury.

For one bond:

- **Nominal value** = `100 PLN`
- **Purchase price** = usually `100 PLN`
- At maturity, the State Treasury pays back:
  - the nominal value,
  - plus interest according to the rules of that bond type.

So the first universal equation is:

```text
Investment amount = number_of_bonds × 100 PLN
```

If you buy `n` bonds, then:

```text
N_total = 100 × n
```

where:
- `n` = number of bonds,
- `N_total` = total nominal amount invested.

---

# 2. The current retail bond types in the official offer

## 2.1 Standard retail bonds

| Symbol | Name | Term | Rate type | Interest payment style | Exchange purchase price |
|---|---:|---:|---|---|---:|
| OTS | 3-month | 3 months | fixed | paid at maturity | 100.00 PLN |
| ROR | 1-year | 12 months | variable | paid every month | 99.90 PLN |
| DOR | 2-year | 24 months | variable | paid every month | 99.90 PLN |
| TOS | 3-year | 3 years | fixed | annual compounding, paid at maturity | 99.90 PLN |
| COI | 4-year | 4 years | year 1 fixed, then inflation + margin | paid every year | 99.90 PLN |
| EDO | 10-year | 10 years | year 1 fixed, then inflation + margin | annual compounding, paid at maturity | 99.90 PLN |

## 2.2 Family bonds

These are available only for beneficiaries of the **Rodzina 800+** program.

| Symbol | Name | Term | Rate type | Interest payment style | Exchange available? |
|---|---:|---:|---|---|---|
| ROS | family 6-year | 6 years | year 1 fixed, then inflation + margin | annual compounding, paid at maturity | no |
| ROD | family 12-year | 12 years | year 1 fixed, then inflation + margin | annual compounding, paid at maturity | no |

---

# 3. Current March 2026 parameters

## 3.1 Rates for the first interest period

| Symbol | First-period rate |
|---|---:|
| OTS0626 | 2.50% p.a. |
| ROR0327 | 4.25% p.a. in the first monthly period |
| DOR0328 | 4.40% p.a. in the first monthly period |
| TOS0329 | 4.65% p.a. fixed for all 3 years |
| COI0330 | 5.00% p.a. in year 1 |
| EDO0336 | 5.60% p.a. in year 1 |
| ROS0332 | 5.20% p.a. in year 1 |
| ROD0338 | 5.85% p.a. in year 1 |

## 3.2 Margins used later

| Symbol | Formula after the first period | Margin |
|---|---|---:|
| ROR | NBP reference rate + margin | 0.00% |
| DOR | NBP reference rate + margin | 0.15% |
| COI | inflation + margin | 1.50% |
| EDO | inflation + margin | 2.00% |
| ROS | inflation + margin | 2.00% |
| ROD | inflation + margin | 2.50% |

---

# 4. The mathematical language used in this guide

We will use the following symbols.

| Symbol | Meaning |
|---|---|
| `N` | nominal value of one bond = 100 PLN |
| `n` | number of bonds |
| `P` | purchase outlay |
| `r` | annual interest rate written as a decimal |
| `r%` | annual interest rate written as a percent |
| `O` | interest amount |
| `W` | final redemption value |
| `WP` | amount received in early redemption |
| `a` | number of actual days accrued in the current period |
| `ACT` or `D` | actual number of days in the interest period |
| `F` | coupon frequency per year |
| `b` | early-redemption fee deducted per bond |
| `i` | inflation rate used for indexed bonds |
| `m` | margin |

### Important percent conversion rule

Before calculation:

```text
r = r% / 100
```

Example:

```text
4.25%  ->  0.0425
5.60%  ->  0.0560
1.50%  ->  0.0150
```

---

# 5. Universal rules before doing any calculation

## 5.1 One bond always starts from 100 PLN nominal

```text
N = 100
```

For many bonds:

```text
N_total = 100 × n
```

## 5.2 Gross and net

Most official formulas are shown **gross** (before tax).

For ordinary taxable investing:

```text
net_interest = gross_interest × (1 - 0.19)
             = gross_interest × 0.81
```

So if gross interest is `10.00 PLN`, then:

```text
net_interest = 10.00 × 0.81 = 8.10 PLN
```

## 5.3 Rounding

The official formulas round amounts to **two decimal places** (1 grosz) where stated in the emission rules.

In practical work:

- calculate using full precision,
- round only where the product rules require,
- for human-readable examples round to 2 decimals.

---

# 6. How to think about each product category

There are three large families:

## 6.1 Fixed-rate, short/simple
- OTS
- TOS

## 6.2 Variable-rate based on the NBP reference rate
- ROR
- DOR

## 6.3 Inflation-indexed
- COI
- EDO
- ROS
- ROD

The key difference is **what creates the rate** and **whether interest is paid out or capitalized**.

---

# 7. OTS — 3-month fixed-rate bonds

## 7.1 What OTS does

OTS is the simplest bond in the offer:

- you buy one bond for `100 PLN`,
- the rate is known in advance,
- there is one short holding period,
- interest is paid at maturity,
- current early redemption fee is `0 PLN`.

For March 2026 the current bond is **OTS0626** with:

```text
rate = 2.50% per year
```

and the official current payout per bond is:

```text
100.63 PLN gross at maturity
```

which means gross interest of:

```text
0.63 PLN per bond
```

## 7.2 Mathematical form

OTS uses a day-count style based on actual days and a yearly rate.

The general short fixed-period formula can be written as:

```text
W = N × (1 + r × a / 365)
```

where:
- `W` = redemption value,
- `N` = nominal value,
- `r` = annual rate as decimal,
- `a` = actual number of days in the investment period.

## 7.3 Example — one OTS bond

Take:
- `N = 100`
- `r = 0.025`
- `a ≈ 92`

Then:

```text
W = 100 × (1 + 0.025 × 92 / 365)
  = 100 × (1 + 0.0063013699)
  = 100.63013699
  ≈ 100.63 PLN
```

Gross interest:

```text
O = 100.63 - 100.00 = 0.63 PLN
```

Net interest after 19% tax:

```text
0.63 × 0.81 = 0.5103 ≈ 0.51 PLN
```

Net payout:

```text
100.00 + 0.51 = 100.51 PLN
```

## 7.4 Example — 50 OTS bonds

```text
n = 50
P = 50 × 100 = 5,000 PLN
gross redemption = 50 × 100.63 = 5,031.50 PLN
gross interest = 31.50 PLN
net interest = 31.50 × 0.81 = 25.515 ≈ 25.52 PLN
net redemption ≈ 5,025.52 PLN
```

## 7.5 Edge case — early redemption

Current fee:

```text
b = 0 PLN
```

So mathematically, OTS is the cleanest case among early-redemption scenarios.

---

# 8. ROR — 1-year variable-rate bonds (NBP reference rate, monthly payouts)

## 8.1 What ROR does

ROR is a one-year bond with:
- interest periods every month,
- monthly cash payouts,
- no capitalization,
- rate changing each month,
- rate formula after month 1:

```text
rate = NBP reference rate + 0.00%
```

So ROR is the closest bond to: “I want regular monthly interest paid to me.”

## 8.2 First-period rule

For the March 2026 series ROR0327:

```text
month 1 annual rate = 4.25%
```

From the second monthly period onward:

```text
r_k = NBP_reference_k + 0.00%
```

with the NBP reference rate taken according to the emission rules.

## 8.3 Official monthly-interest formula

For a monthly coupon product, the official structure is:

```text
O = N × r × a / (D × F)
```

where:
- `N = 100`,
- `r` = annual rate in decimal,
- `a` = actual accrued days up to date `d`,
- `D` = actual days in that coupon period,
- `F = 12` for monthly payouts.

For a **full monthly period**, normally `a = D`, so the formula simplifies to:

```text
O = N × r / 12
```

## 8.4 Example — first monthly payout for one bond

Take:
- `N = 100`
- `r = 0.0425`
- `F = 12`

Then for a full month:

```text
O = 100 × 0.0425 / 12
  = 0.3541666667
  ≈ 0.35 PLN
```

This matches the official first-period interest of about `0.35 PLN` gross.

Net monthly payout:

```text
0.35 × 0.81 = 0.2835 ≈ 0.28 PLN
```

## 8.5 Example — full 12 months, hypothetical constant NBP rate

Suppose the NBP reference rate stayed constant at `5.25%` after month 1.

Then:
- month 1 annual rate = `4.25%`
- months 2–12 annual rate = `5.25%`

### Month 1
```text
O_1 = 100 × 0.0425 / 12 = 0.354166... ≈ 0.35
```

### Month 2 to Month 12
```text
O_k = 100 × 0.0525 / 12 = 0.4375 ≈ 0.44
```

### Total gross for one bond
```text
gross = 0.35 + 11 × 0.44
      = 0.35 + 4.84
      = 5.19 PLN
```

### For 100 bonds
```text
gross = 100 × 5.19 = 519.00 PLN
net = 519.00 × 0.81 = 420.39 PLN
```

Because ROR pays monthly, there is **no annual compounding inside the bond**.

## 8.6 Edge case — reference rate falls sharply

Suppose:
- month 1: 4.25%
- later NBP reference rate = 1.00%

Then:
```text
O_k = 100 × 0.01 / 12 = 0.083333... ≈ 0.08 PLN gross per month
```

So the cash flow can drop strongly if NBP cuts rates.

## 8.7 Edge case — negative rate environment

The rules state that if the reference component is below zero, it is treated as zero.

So for ROR:

```text
if NBP_reference < 0, use 0
```

Thus:

```text
r_k = max(NBP_reference, 0) + 0.00%
```

So the bond never gets a negative annual rate from that formula.

## 8.8 Early redemption for ROR

Fee per bond:

```text
b = 0.50 PLN
```

In the first interest period, the deduction is limited so the investor does not go below nominal value according to the product rules.

A practical simplified interpretation for one bond is:

```text
WP ≈ 100 + accrued_interest - applicable_fee
```

with protection in the first period so the payable amount is not below `100 PLN`.

### Example — early redemption after 10 days in a 30-day first month

Take:
- `N = 100`
- `r = 0.0425`
- `a = 10`
- `D = 30`
- `F = 12`

Accrued gross interest:

```text
O = 100 × 0.0425 × 10 / (30 × 12)
  = 0.118055...
  ≈ 0.12 PLN
```

Fee cap in the first period means the deduction cannot push you below nominal, so with such a tiny accrued amount the practical payout is approximately:

```text
WP = 100.00 PLN
```

This is an important beginner edge case:

> In very early redemption, you may effectively receive **no profit at all**, because the fee can absorb the accrued interest.

---

# 9. DOR — 2-year variable-rate bonds (NBP reference rate, monthly payouts)

## 9.1 What DOR does

DOR is mathematically similar to ROR, but:
- lasts 24 months,
- pays monthly,
- margin is positive:

```text
rate = NBP reference rate + 0.15%
```

For March 2026:

```text
month 1 rate = 4.40%
```

Later:

```text
r_k = NBP_reference_k + 0.15%
```

## 9.2 Monthly-interest formula

Same coupon formula as ROR:

```text
O = N × r × a / (D × F)
```

For a full monthly period:

```text
O = N × r / 12
```

## 9.3 Example — first month for one bond

```text
N = 100
r = 0.044
O = 100 × 0.044 / 12
  = 0.366666...
  ≈ 0.37 PLN gross
```

## 9.4 Example — hypothetical stable NBP reference rate of 5.25%

Then later annual rate would be:

```text
r = 5.25% + 0.15% = 5.40% = 0.054
```

Monthly gross interest:

```text
O = 100 × 0.054 / 12 = 0.45 PLN
```

### Gross over 24 months for one bond
- month 1: `0.37`
- months 2–24: `23 × 0.45 = 10.35`

Total:

```text
gross = 0.37 + 10.35 = 10.72 PLN
```

Net:

```text
10.72 × 0.81 = 8.6832 ≈ 8.68 PLN
```

### For 200 bonds
```text
gross = 200 × 10.72 = 2,144.00 PLN
net = 2,144.00 × 0.81 = 1,736.64 PLN
```

## 9.5 Edge case — DOR versus ROR

If the NBP reference rate were the same each month, then DOR should pay more than ROR because it has a `+0.15%` margin.

For one month, the extra gross interest per bond is:

```text
delta = 100 × 0.0015 / 12
      = 0.0125 PLN
      ≈ 0.01 PLN
```

Over 24 full months:

```text
24 × 0.0125 = 0.30 PLN gross extra per bond
```

Small per bond, meaningful for large holdings.

## 9.6 Early redemption for DOR

Fee per bond:

```text
b = 0.70 PLN
```

The same practical lesson applies as for ROR:
- if you redeem early, the fee may eat a large part of the accrued interest,
- especially near the beginning of a period.

---

# 10. TOS — 3-year fixed-rate bonds with annual compounding

## 10.1 What TOS does

TOS is a 3-year bond with:
- one fixed annual rate for all 3 years,
- annual capitalization,
- no yearly payout to your bank account,
- all money paid at the end.

For March 2026:

```text
r = 4.65% fixed for all 3 years
```

## 10.2 Final-value formula

Because interest is capitalized every year:

```text
W = N × (1 + r)^3
```

where:
- `N = 100`,
- `r = 0.0465`.

## 10.3 Example — one bond

```text
W = 100 × (1.0465)^3
  = 100 × 1.146085679625
  = 114.6085679625
  ≈ 114.61 PLN
```

Gross interest:

```text
114.61 - 100.00 = 14.61 PLN
```

That matches the official current figure.

Net interest:

```text
14.61 × 0.81 = 11.8341 ≈ 11.83 PLN
```

Net redemption:

```text
100 + 11.83 = 111.83 PLN
```

## 10.4 Example — 150 bonds

```text
investment = 150 × 100 = 15,000 PLN
gross redemption = 150 × 114.61 = 17,191.50 PLN
gross interest = 2,191.50 PLN
net interest = 2,191.50 × 0.81 = 1,775.115 ≈ 1,775.12 PLN
net redemption ≈ 16,775.12 PLN
```

## 10.5 Why compounding matters

Compare simple interest and compound interest.

### If it were simple interest only:
```text
simple = 100 × (1 + 3 × 0.0465)
       = 113.95 PLN
```

### Actual TOS with annual compounding:
```text
compound = 114.61 PLN
```

Extra gain from compounding:

```text
114.61 - 113.95 = 0.66 PLN per bond
```

## 10.6 Early redemption for TOS

Fee per bond:

```text
b = 1.00 PLN
```

A simplified annual-compounding early-redemption model is:

```text
WP_k = N_{k-1} × (1 + r × a / ACT) - b
```

where:
- `N_{k-1}` = capital already grown up to the start of year `k`,
- `a / ACT` = fraction of the current year already accrued,
- `b = 1.00 PLN`.

### Example — midway through year 2

Take:
- one bond,
- end of year 1 value:

```text
N_1 = 100 × 1.0465 = 104.65
```

If redeemed halfway through year 2:
- `a / ACT ≈ 0.5`

Then accrued partial value before fee:

```text
104.65 × (1 + 0.0465 × 0.5)
= 104.65 × 1.02325
= 107.0836125
≈ 107.08
```

After fee:

```text
107.08 - 1.00 = 106.08 PLN
```

---

# 11. COI — 4-year inflation-indexed bonds with annual payouts

## 11.1 What COI does

COI works like this:
- year 1 has a fixed rate,
- years 2–4 use:

```text
rate = inflation + 1.50%
```

- interest is **paid out every year**,
- the nominal value remains `100 PLN`,
- there is **no capitalization** inside the bond.

For March 2026:

```text
year 1 rate = 5.00%
```

## 11.2 Rate formula from year 2 onward

```text
r_k = i_k + m
```

where:
- `i_k` = inflation rate used for that annual period,
- `m = 1.50% = 0.015`.

If inflation is negative, the rules set:

```text
if i_k < 0, then i_k = 0
```

So the effective rate floor is:

```text
r_k = max(i_k, 0) + 1.50%
```

## 11.3 Annual payout formula

COI pays interest each year from the original nominal amount:

```text
O_k = N × r_k
```

Since `N = 100`, calculation is especially simple.

## 11.4 Example — one bond with hypothetical inflation path

Assume:
- year 1: fixed `5.00%`
- year 2 inflation = `3.20%`
- year 3 inflation = `2.40%`
- year 4 inflation = `1.80%`

Then:

### Year 1
```text
r_1 = 5.00% = 0.05
O_1 = 100 × 0.05 = 5.00 PLN
```

### Year 2
```text
r_2 = 3.20% + 1.50% = 4.70% = 0.047
O_2 = 100 × 0.047 = 4.70 PLN
```

### Year 3
```text
r_3 = 2.40% + 1.50% = 3.90% = 0.039
O_3 = 100 × 0.039 = 3.90 PLN
```

### Year 4
```text
r_4 = 1.80% + 1.50% = 3.30% = 0.033
O_4 = 100 × 0.033 = 3.30 PLN
```

### Total gross interest over 4 years
```text
gross_total = 5.00 + 4.70 + 3.90 + 3.30 = 16.90 PLN
```

Net total interest:

```text
16.90 × 0.81 = 13.689 ≈ 13.69 PLN
```

At maturity you additionally get back nominal value:

```text
final_principal = 100 PLN
```

## 11.5 Important beginner insight

COI is **not** compounded automatically in the bond.

So if you receive annual payouts and do nothing with them, your total return is:

```text
sum of annual coupons + returned principal
```

If you reinvest the annual coupons separately, the whole strategy becomes a separate compounding process.

## 11.6 Edge case — deflation year

Suppose year-2 inflation = `-1.20%`.

Then the rules use:

```text
i = 0
```

So:

```text
r_2 = 0 + 1.50% = 1.50%
O_2 = 100 × 0.015 = 1.50 PLN
```

This is an important protective rule.

## 11.7 Early redemption for COI

Fee per bond:

```text
b = 2.00 PLN
```

Official simplified form for the current annual period:

```text
WP = N × (1 + r × a / ACT) - b
```

with first-period protection so the amount does not go below nominal in the relevant case.

### Example — after 200 days in year 1

Take:
- `N = 100`
- `r = 0.05`
- `a = 200`
- `ACT = 365`
- `b = 2.00`

Then:

```text
WP = 100 × (1 + 0.05 × 200/365) - 2
   = 100 × (1 + 0.02739726) - 2
   = 102.739726 - 2
   = 100.739726
   ≈ 100.74 PLN
```

So even though the annual rate is decent, the `2 PLN` fee matters a lot if you exit early.

---

# 12. EDO — 10-year inflation-indexed bonds with annual compounding

## 12.1 What EDO does

EDO is a long-term inflation-indexed bond:
- year 1 rate is fixed,
- years 2–10 use:

```text
rate = inflation + 2.00%
```

- interest is **capitalized every year**,
- nothing is paid out yearly,
- all value is collected at maturity.

For March 2026:

```text
year 1 rate = 5.60%
```

## 12.2 Rate formula from year 2 onward

```text
r_k = i_k + 2.00%
```

with the same inflation floor:

```text
if i_k < 0, use i_k = 0
```

## 12.3 Final-value formula

For 10 years:

```text
W = N × (1 + r_1) × (1 + r_2) × ... × (1 + r_10)
```

This is one of the most important formulas in the whole guide.

It says:

> every year, next year's interest is calculated on a bigger capital base.

## 12.4 Example — one bond with hypothetical inflation path

Assume:
- year 1: `5.60%`
- years 2–10: inflation = `3.00%` every year
- therefore years 2–10 rate = `3.00% + 2.00% = 5.00%`

Then:

```text
W = 100 × 1.056 × (1.05)^9
```

Now:

```text
(1.05)^9 = 1.5513282159785162
W = 100 × 1.056 × 1.5513282159785162
  = 163.8222596073313
  ≈ 163.82 PLN
```

Gross interest:

```text
163.82 - 100.00 = 63.82 PLN
```

Net interest:

```text
63.82 × 0.81 = 51.6942 ≈ 51.69 PLN
```

Net redemption:

```text
151.69 PLN
```

## 12.5 Why EDO is mathematically stronger than COI for long horizons

COI:
- pays out yearly,
- no automatic reinvestment inside the bond.

EDO:
- capitalizes yearly,
- automatically compounds.

If the annual rates are positive for many years, compounding can create a much larger end value.

## 12.6 Edge case — one deflation year

Suppose in year 5 inflation = `-2.00%`.

Then:

```text
i_5 = 0
r_5 = 0 + 2.00% = 2.00%
```

So the capital still grows in year 5:

```text
capital_after_year5 = capital_after_year4 × 1.02
```

## 12.7 Early redemption for EDO

Fee per bond:

```text
b = 3.00 PLN
```

The simplified partial-year formula in year `k` is conceptually:

```text
WP_k = N × (1+r_1) × ... × (1+r_{k-1}) × (1 + r_k × a/ACT) - b
```

### Example — halfway through year 3

Assume:
- year 1: `5.60%`
- year 2: `5.00%`
- year 3 current annual rate: `5.00%`
- half-year accrued in year 3

Step 1: value at start of year 3

```text
start_year3 = 100 × 1.056 × 1.05
            = 110.88 PLN
```

Step 2: accrue half of year 3

```text
partial = 110.88 × (1 + 0.05 × 0.5)
        = 110.88 × 1.025
        = 113.652 PLN
```

Step 3: fee

```text
WP ≈ 113.65 - 3.00 = 110.65 PLN
```

This shows that long bonds can still be profitable on early redemption, but the fee remains meaningful.

---

# 13. ROS — 6-year family inflation-indexed bonds with annual compounding

## 13.1 Who can buy ROS

ROS is for beneficiaries of **Rodzina 800+**.

## 13.2 Structure

- year 1 fixed,
- years 2–6:

```text
rate = inflation + 2.00%
```

- annual capitalization,
- payout at maturity,
- **no exchange purchase**.

For March 2026:

```text
year 1 rate = 5.20%
```

## 13.3 Final-value formula

```text
W = N × (1 + r_1) × (1 + r_2) × ... × (1 + r_6)
```

## 13.4 Example — one bond

Assume:
- year 1 = `5.20%`
- years 2–6 inflation = `3.00%`
- so years 2–6 rate = `5.00%`

Then:

```text
W = 100 × 1.052 × (1.05)^5
```

Now:

```text
(1.05)^5 = 1.2762815625
W = 100 × 1.052 × 1.2762815625
  = 134.225822375
  ≈ 134.23 PLN
```

Gross interest:

```text
34.23 PLN
```

Net interest:

```text
34.23 × 0.81 = 27.7263 ≈ 27.73 PLN
```

## 13.5 Early redemption for ROS

Fee per bond:

```text
b = 2.00 PLN
```

### Example — after year 1 and 100 days into year 2

Assume:
- year 1 rate `5.20%`
- year 2 rate `5.00%`
- `a = 100`, `ACT = 365`

After year 1:

```text
C1 = 100 × 1.052 = 105.20
```

Accrued in year 2:

```text
C_partial = 105.20 × (1 + 0.05 × 100/365)
          = 105.20 × 1.01369863
          = 106.64141589
          ≈ 106.64
```

After fee:

```text
WP ≈ 106.64 - 2.00 = 104.64 PLN
```

---

# 14. ROD — 12-year family inflation-indexed bonds with annual compounding

## 14.1 Who can buy ROD

ROD is also for beneficiaries of **Rodzina 800+**.

## 14.2 Structure

- year 1 fixed,
- years 2–12:

```text
rate = inflation + 2.50%
```

- annual capitalization,
- payout at maturity,
- **no exchange purchase**.

For March 2026:

```text
year 1 rate = 5.85%
```

## 14.3 Final-value formula

```text
W = N × (1 + r_1) × (1 + r_2) × ... × (1 + r_12)
```

## 14.4 Example — one bond with constant inflation assumption

Assume:
- year 1 = `5.85%`
- years 2–12 inflation = `3.00%`
- so years 2–12 rate = `5.50%`

Then:

```text
W = 100 × 1.0585 × (1.055)^11
```

Now:

```text
(1.055)^11 = 1.8015584792059028
W = 100 × 1.0585 × 1.8015584792059028
  = 190.49546302354278
  ≈ 190.50 PLN
```

Gross interest:

```text
90.50 PLN
```

Net interest:

```text
90.50 × 0.81 = 73.305 ≈ 73.31 PLN
```

Net redemption:

```text
173.31 PLN
```

## 14.5 Edge case — long horizon sensitivity

Long compounding makes ROD very sensitive to long-run inflation assumptions.

Compare 11 later years at:

### 4.50% later rate
```text
W_low = 100 × 1.0585 × (1.045)^11
```

### 6.50% later rate
```text
W_high = 100 × 1.0585 × (1.065)^11
```

Even a seemingly small annual-rate difference compounds strongly over 12 years.

## 14.6 Early redemption for ROD

Fee per bond:

```text
b = 3.00 PLN
```

Same compounding logic as EDO, just with 12 years and a larger inflation margin than EDO.

---

# 15. Exchange purchase (“zamiana”) and the discount for buying the next bond in sequence

This is one of the most important practical issues you asked about.

## 15.1 What “zamiana” means

When an older bond matures, you may use its redemption claim to buy a new bond immediately in the exchange mechanism.

For most current standard bonds, the exchange purchase price is:

```text
99.90 PLN instead of 100.00 PLN
```

That means an effective discount of:

```text
0.10 PLN per new bond
```

Important exceptions in the current offer:
- OTS exchange price: `100.00 PLN`
- ROS and ROD: no exchange purchase

## 15.2 Core mathematical effect of exchange

If the exchange price is `99.90 PLN` and the nominal value remains `100 PLN`, then the investor receives an immediate economic advantage of:

```text
discount_per_bond = 100.00 - 99.90 = 0.10 PLN
```

For `n` bonds:

```text
total_discount = 0.10 × n
```

## 15.3 Example — reinvesting 100 matured bonds into new TOS

Suppose 100 old bonds matured, giving enough redemption cash.

Buying 100 new TOS bonds in exchange:

### Without exchange discount
```text
cost = 100 × 100.00 = 10,000.00 PLN
```

### With exchange discount
```text
cost = 100 × 99.90 = 9,990.00 PLN
```

Difference:

```text
10,000.00 - 9,990.00 = 10.00 PLN
```

So `10.00 PLN` remains in cash or reduces the amount of extra money needed.

## 15.4 Test case — rolling TOS into TOS again

Let:
- first TOS cycle grows one bond to `114.61 PLN` gross,
- then you buy a new TOS in exchange at `99.90 PLN`.

Cash left after buying the new bond:

```text
leftover = 114.61 - 99.90 = 14.71 PLN
```

Without the discount the leftover would be:

```text
114.61 - 100.00 = 14.61 PLN
```

So the second-cycle exchange adds:

```text
14.71 - 14.61 = 0.10 PLN
```

per rolled bond.

## 15.5 Test case — rolling 250 EDO/COI/TOS/ROR/DOR maturities into new bonds

For eligible standard bonds priced at `99.90 PLN` in exchange:

```text
total_discount = 250 × 0.10 = 25.00 PLN
```

## 15.6 Test case — long sequence of repeated rollovers

Suppose you keep rolling `n = 300` eligible bonds into new eligible bonds once per cycle, for `s = 8` cycles.

Total nominal discount effect over the sequence:

```text
discount_total = n × 0.10 × s
               = 300 × 0.10 × 8
               = 240.00 PLN
```

This is **separate from interest**. It is an extra mechanical benefit from repeated exchange purchases.

## 15.7 Test case — compare with and without discount over 3 cycles

Suppose each time you buy 100 eligible bonds.

### With discount
```text
cycle_cost = 100 × 99.90 = 9,990 PLN
3 cycles total purchase outlay = 29,970 PLN
```

### Without discount
```text
cycle_cost = 100 × 100.00 = 10,000 PLN
3 cycles total purchase outlay = 30,000 PLN
```

Difference after 3 cycles:

```text
30,000 - 29,970 = 30 PLN
```

That is the pure exchange benefit.

---

# 16. Comparing payout mechanics: the most important beginner distinction

## 16.1 Monthly payout bonds
- ROR
- DOR

You **receive interest during the life of the bond**.

Mathematically:
```text
total_return = sum of monthly payouts + returned nominal at final maturity
```

## 16.2 Annual payout without compounding inside the bond
- COI

You **receive one annual coupon every year**.

Mathematically:
```text
total_return = O_1 + O_2 + O_3 + O_4 + nominal
```

## 16.3 Annual capitalization, payout only at the end
- TOS
- EDO
- ROS
- ROD

You do **not** receive cash during the life of the bond.
Interest is added to the bond value.

Mathematically:
```text
final_value = nominal × product of yearly growth factors
```

---

# 17. How to compute annual yield correctly for these products

There are several “yield” ideas. Do not confuse them.

## 17.1 Simple annual rate

This is just the stated annual rate.

Example:
```text
5.60%
```

## 17.2 Effective annual return for a compounded fixed-rate bond

If the rate compounds once per year and equals `r`, then the effective annual rate is simply:

```text
EAR = r
```

because compounding frequency is annual.

## 17.3 Multi-year total return for a compounded bond

For TOS:

```text
total_return = (1 + r)^3 - 1
```

Example for `r = 0.0465`:

```text
(1.0465)^3 - 1 = 0.146085679625
≈ 14.61%
```

## 17.4 Average annualized return over many years

If final value is `W` from initial `N` over `T` years:

```text
annualized_return = (W / N)^(1/T) - 1
```

### Example — TOS
```text
W = 114.61
N = 100
T = 3

annualized_return = (114.61 / 100)^(1/3) - 1
                  ≈ 0.0465
                  = 4.65%
```

### Example — EDO hypothetical case
```text
W = 163.82
N = 100
T = 10

annualized_return = (163.82 / 100)^(1/10) - 1
                  ≈ 5.06%
```

That annualized return summarizes a multi-year path in one number.

---

# 18. Full test-case block for long-term investors

This section gives several strict test cases.

## Test Case A — 100 TOS bonds held to maturity

Input:
```text
n = 100
N = 100
r = 0.0465
T = 3
```

Per bond:
```text
W = 100 × (1.0465)^3 = 114.61
```

Portfolio:
```text
initial = 100 × 100 = 10,000
final_gross = 100 × 114.61 = 11,461.00
gross_interest = 1,461.00
net_interest = 1,461.00 × 0.81 = 1,183.41
final_net = 11,183.41
```

## Test Case B — 100 COI bonds with annual coupons, no reinvestment

Assume annual rates:
```text
r1 = 5.00%
r2 = 4.70%
r3 = 3.90%
r4 = 3.30%
```

Per bond coupons:
```text
5.00 + 4.70 + 3.90 + 3.30 = 16.90
```

For 100 bonds:
```text
gross coupons = 1,690.00
net coupons = 1,690.00 × 0.81 = 1,368.90
returned principal = 10,000
total cash received net = 11,368.90
```

## Test Case C — 100 EDO bonds with compounding

Assume:
```text
r1 = 5.60%
r2 = ... = r10 = 5.00%
```

Per bond:
```text
W = 100 × 1.056 × (1.05)^9 = 163.82
```

For 100 bonds:
```text
final_gross = 16,382.00
gross_interest = 6,382.00
net_interest = 6,382.00 × 0.81 = 5,169.42
final_net = 15,169.42
```

## Test Case D — two consecutive TOS cycles with exchange discount

### Cycle 1
```text
buy 100 bonds at 100 = 10,000 PLN
maturity gross = 11,461.00 PLN
```

### Cycle 2 purchase in exchange
```text
100 new bonds × 99.90 = 9,990 PLN
```

Residual cash after repurchase:
```text
11,461.00 - 9,990.00 = 1,471.00 PLN
```

Without discount:
```text
11,461.00 - 10,000.00 = 1,461.00 PLN
```

Difference:
```text
10.00 PLN
```

### Cycle 2 maturity value of the repurchased 100 bonds
Again:
```text
100 × 114.61 = 11,461.00 PLN gross
```

So after two cycles, the exchange discount gave an additional `10 PLN` of cash over the version without exchange discount.

## Test Case E — repeated annual-coupon strategy versus compounded strategy

Compare one COI bond and one EDO bond under a stylized path:

- year 1 fixed:
  - COI = 5.00%
  - EDO = 5.60%
- later years:
  - COI = 4.50%
  - EDO = 5.00%

### COI after 4 years, no reinvestment
```text
coupons = 5.00 + 4.50 + 4.50 + 4.50 = 18.50
final_cash = 118.50 gross
```

### EDO after 4 years, compounded
```text
W = 100 × 1.056 × 1.05 × 1.05 × 1.05
  = 122.27 gross
```

This shows the mechanical power of capitalization.

---

# 19. Practical beginner rules distilled from the mathematics

## 19.1 If you want monthly cash flow
Choose:
- ROR
- DOR

## 19.2 If you want a known fixed final result over a few years
Choose:
- TOS

## 19.3 If you want inflation linkage but yearly cash access
Choose:
- COI

## 19.4 If you want inflation linkage and maximum compounding
Choose:
- EDO
- ROS
- ROD

## 19.5 If you may need the money very soon
Be careful:
- early-redemption fees can consume much of the accrued interest.

---

# 20. The most useful formula summary sheet

## 20.1 Purchase amount
```text
P = 100 × n
```

## 20.2 OTS short-period payout
```text
W = N × (1 + r × a / 365)
```

## 20.3 ROR / DOR monthly coupon
```text
O = N × r × a / (D × 12)
```

For a full monthly period:
```text
O = N × r / 12
```

## 20.4 COI annual coupon
```text
O_k = N × r_k
```

## 20.5 TOS final value
```text
W = N × (1 + r)^3
```

## 20.6 EDO / ROS / ROD final value
```text
W = N × Π(1 + r_k)
```

That means:
```text
W = N × (1 + r_1)(1 + r_2)...(1 + r_T)
```

## 20.7 Variable-rate formulas
### ROR
```text
r_k = max(NBP_reference_k, 0) + 0.00%
```

### DOR
```text
r_k = max(NBP_reference_k, 0) + 0.15%
```

### COI
```text
r_k = max(inflation_k, 0) + 1.50%
```

### EDO
```text
r_k = max(inflation_k, 0) + 2.00%
```

### ROS
```text
r_k = max(inflation_k, 0) + 2.00%
```

### ROD
```text
r_k = max(inflation_k, 0) + 2.50%
```

## 20.8 Net interest approximation for taxable investing
```text
net = gross × 0.81
```

## 20.9 Exchange discount
For eligible standard bonds:
```text
discount_per_bond = 100.00 - 99.90 = 0.10 PLN
total_discount = 0.10 × n
```

---

# 21. Final conclusions

1. **Every bond starts from 100 PLN nominal.**
2. **ROR and DOR** are monthly-cash-flow products tied to the NBP reference rate.
3. **TOS** is a fixed 3-year compounding product.
4. **COI** pays yearly coupons and is linked to inflation after year 1.
5. **EDO, ROS, ROD** use annual capitalization, so they are the most mathematically “compound-interest-like”.
6. **Exchange purchase at 99.90 PLN** is a real mechanical advantage for most standard bonds that support exchange.
7. **Early redemption fees matter a lot**, especially when little interest has accrued.
8. The cleanest way to analyze any Polish savings bond is:
   - identify whether it pays monthly, yearly, or compounds,
   - write the correct formula,
   - insert the rate path,
   - apply fees and then tax.

---

# 22. Notes on scope

This file describes the **current retail savings-bond offer structure in Poland** and gives explicit mathematical examples.  
Each monthly series has its own emission letter, period dates, and precise technical details.  
For actual investing, always verify the current series parameters before purchase.
