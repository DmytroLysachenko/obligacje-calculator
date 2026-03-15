# Real Return of Polish Treasury Bonds with Inflation (Mathematical Guide)

This document explains **how to calculate the real profit of Polish
Treasury bonds after taxes, early redemption fees, and inflation**.

The goal is to compute:

-   **Gross nominal profit**
-   **Net nominal profit (after tax and fees)**
-   **Real profit after inflation**
-   **Real annualized yield**

This guide focuses especially on **10‑year inflation‑indexed bonds
(EDO)** and cases where the bond is **sold before maturity**.

------------------------------------------------------------------------

# 1. Key Variables

  Symbol   Meaning
  -------- ----------------------------------
  N        nominal value per bond (100 PLN)
  n        number of bonds
  P        purchase value
  r_k      interest rate in year k
  i_k      inflation rate in year k
  m        inflation margin (for EDO = 2%)
  T        total years invested
  b        early redemption fee per bond
  tax      capital gains tax (19%)
  W        nominal bond value at sale
  W_net    value after taxes and fees
  R_real   real value after inflation

Nominal bond price:

    N = 100 PLN

Investment:

    P = N × n

------------------------------------------------------------------------

# 2. Nominal Value Growth for Inflation‑Indexed Bonds

For EDO bonds:

Year 1 has fixed rate.

Later years:

    r_k = max(i_k,0) + m

For EDO:

    m = 2%

The nominal value after T years:

    W = N × Π (1 + r_k)

Expanded:

    W = N × (1+r₁)(1+r₂)...(1+r_T)

------------------------------------------------------------------------

# 3. Early Redemption Calculation

If the bond is sold before maturity the early redemption fee is
deducted.

For EDO:

    b = 3 PLN per bond

Value after fee:

    W_fee = W − b

If holding n bonds:

    W_fee_total = n × (W − b)

------------------------------------------------------------------------

# 4. Capital Gains Tax

Polish capital gains tax:

    tax = 19%

Taxable profit:

    profit_gross = W_fee − N

Tax amount:

    tax_amount = profit_gross × 0.19

Net value after tax:

    W_net = W_fee − tax_amount

------------------------------------------------------------------------

# 5. Inflation Adjustment

Money loses purchasing power due to inflation.

To calculate **real value**, divide nominal value by cumulative
inflation.

Cumulative inflation factor:

    I = Π (1 + i_k)

Real value:

    R_real = W_net / I

Real profit:

    profit_real = R_real − N

------------------------------------------------------------------------

# 6. Real Annualized Return

Real annual yield:

    r_real = (R_real / N)^(1/T) − 1

This is the **true annual return after inflation**.

------------------------------------------------------------------------

# 7. Complete Example

Example investment:

    n = 1 bond
    N = 100 PLN
    T = 9 years
    m = 2%

Inflation scenario:

  Year   Inflation
  ------ -----------
  1      ---
  2      4%
  3      5%
  4      3%
  5      3%
  6      4%
  7      2%
  8      2%
  9      2%

Interest rates:

    year1 = 5.6%
    year2 = 4% +2% = 6%
    year3 = 5% +2% = 7%
    year4 = 3% +2% = 5%
    year5 = 3% +2% = 5%
    year6 = 4% +2% = 6%
    year7 = 2% +2% = 4%
    year8 = 2% +2% = 4%
    year9 = 2% +2% = 4%

Nominal value growth:

    W = 100 ×1.056×1.06×1.07×1.05×1.05×1.06×1.04×1.04×1.04

Result:

    W ≈ 155.72 PLN

------------------------------------------------------------------------

# 8. Early Redemption

Fee:

    b = 3 PLN

Value after fee:

    W_fee = 155.72 − 3 = 152.72 PLN

------------------------------------------------------------------------

# 9. Tax Calculation

Gross profit:

    profit_gross = 152.72 − 100
    = 52.72 PLN

Tax:

    tax = 52.72 ×0.19
    = 10.02 PLN

Net value:

    W_net = 152.72 −10.02
    = 142.70 PLN

Net nominal profit:

    42.70 PLN

------------------------------------------------------------------------

# 10. Inflation Adjustment

Cumulative inflation factor:

    I = 1.04×1.05×1.03×1.03×1.04×1.02×1.02×1.02

Result:

    I ≈ 1.268

Real value:

    R_real = 142.70 /1.268
    ≈ 112.55 PLN

Real profit:

    112.55 −100
    = 12.55 PLN

------------------------------------------------------------------------

# 11. Real Annual Yield

    r_real = (112.55 /100)^(1/9) −1

Result:

    r_real ≈ 1.31% per year

So:

  Metric               Value
  -------------------- -----------
  Nominal net profit   42.7 PLN
  Real profit          12.55 PLN
  Real annual return   1.31%

------------------------------------------------------------------------

# 12. Simplified Universal Formula

To calculate **real bond return**:

Step 1 --- nominal growth

    W = N × Π(1+r_k)

Step 2 --- early redemption

    W_fee = W − b

Step 3 --- taxes

    W_net = W_fee − (W_fee − N)×0.19

Step 4 --- inflation adjustment

    R_real = W_net / Π(1+i_k)

Step 5 --- real annual return

    r_real = (R_real/N)^(1/T) −1

------------------------------------------------------------------------

# 13. Key Insight

Inflation‑indexed bonds protect capital **only partially**.

Even with inflation linkage:

-   taxes reduce returns
-   early redemption fees reduce returns
-   compounding of inflation reduces purchasing power

Therefore the **real return is usually much lower than the nominal
return**.
