# 09. Economic Principles for Modeling Bond Investments and Long-Term Portfolios

This document describes the **core economic concepts and mathematical
formulas** useful for building an application that models conservative
investment strategies such as **government bonds and low‑risk
portfolios**.

The goal is to help developers and users understand:

-   inflation and purchasing power
-   compounding and capitalization
-   interest rate dynamics
-   unemployment and macroeconomic influence
-   portfolio growth modeling
-   regular vs irregular investing
-   real vs nominal returns

These principles can be used to design **financial simulation engines**.

------------------------------------------------------------------------

# 1. Nominal vs Real Values

## Nominal Value

Nominal value is the value measured in current currency without
considering inflation.

Example:

    100 PLN invested today
    120 PLN after 10 years

Nominal profit:

    120 − 100 = 20 PLN

------------------------------------------------------------------------

## Real Value

Real value adjusts for inflation.

Real value formula:

    RealValue = NominalValue / InflationFactor

Where:

    InflationFactor = Π (1 + inflation_k)

Example:

If cumulative inflation over 10 years is 30%:

    InflationFactor = 1.30

Real value:

    120 / 1.30 = 92.31 PLN

Real profit:

    92.31 − 100 = −7.69 PLN

This means the investment **lost purchasing power**.

------------------------------------------------------------------------

# 2. Inflation

Inflation measures the **rate of increase in prices**.

Annual inflation formula:

    InflationRate = (PriceIndex_t − PriceIndex_(t−1)) / PriceIndex_(t−1)

Example:

If CPI increases from 100 to 105:

    (105 − 100) / 100 = 5%

------------------------------------------------------------------------

## Cumulative Inflation

Over many years:

    TotalInflation = Π (1 + inflation_k) − 1

Example:

Inflation sequence:

    3%, 4%, 5%

Cumulative:

    1.03 × 1.04 × 1.05 = 1.12476

Total inflation:

    12.48%

------------------------------------------------------------------------

# 3. Compound Interest

Compound interest is the main growth mechanism for investments.

Formula:

    FutureValue = Principal × (1 + r)^t

Where:

-   r = interest rate
-   t = number of years

Example:

    100 × (1.05)^10 = 162.89

Profit:

    62.89 PLN

------------------------------------------------------------------------

## Continuous Compounding

Some theoretical models use continuous compounding.

Formula:

    FutureValue = Principal × e^(r × t)

Example:

    100 × e^(0.05×10)
    ≈ 164.87

------------------------------------------------------------------------

# 4. Real Interest Rate

The **Fisher Equation** relates real and nominal rates.

Approximation:

    RealRate ≈ NominalRate − InflationRate

More precise:

    1 + NominalRate = (1 + RealRate)(1 + InflationRate)

Example:

Nominal rate:

    6%

Inflation:

    4%

Real rate:

    (1.06 / 1.04) − 1 = 1.92%

------------------------------------------------------------------------

# 5. Time Value of Money

Money today is worth more than money tomorrow.

Discount formula:

    PresentValue = FutureValue / (1 + r)^t

Example:

Future value:

    1000 PLN

Discount rate:

    5%

10 years:

    PV = 1000 / (1.05)^10
    PV ≈ 613.91 PLN

------------------------------------------------------------------------

# 6. Regular Investing (Dollar Cost Averaging)

For regular monthly investments:

    FV = P × ((1+r)^n − 1) / r

Where:

-   P = periodic investment
-   r = periodic interest
-   n = number of periods

Example:

    200 PLN monthly
    5% annual return
    20 years

Monthly rate:

    0.05 / 12

Periods:

    240

------------------------------------------------------------------------

# 7. Portfolio Value

For multiple assets:

    PortfolioValue = Σ AssetValue_i

If:

    Bonds = 60%
    Stocks = 40%

Then:

    PortfolioReturn = 0.6 × ReturnBonds + 0.4 × ReturnStocks

------------------------------------------------------------------------

# 8. Risk and Volatility

Risk is commonly measured by **variance or standard deviation**.

Variance:

    Var = Σ (r_i − mean)^2 / n

Standard deviation:

    σ = √Var

Higher volatility means higher uncertainty.

------------------------------------------------------------------------

# 9. Unemployment and Economic Growth

Unemployment influences economic activity.

Simplified relation:

    GDPGrowth ≈ PotentialGrowth − 2 × (Unemployment − NaturalRate)

This is related to **Okun's Law**.

Example:

Natural unemployment:

    4%

Actual unemployment:

    6%

Difference:

    2%

GDP impact:

    −4%

------------------------------------------------------------------------

# 10. Interest Rates and Monetary Policy

Central banks control short‑term interest rates.

In Poland the main benchmark is:

    NBP reference rate

Interest rate models influence:

-   government bonds
-   mortgage rates
-   inflation expectations

------------------------------------------------------------------------

# 11. Bond Pricing Concept

General bond price formula:

    Price = Σ Coupon_t / (1+r)^t + Nominal/(1+r)^T

Where:

-   r = market interest rate

If interest rates increase:

    bond prices decrease

------------------------------------------------------------------------

# 12. Long-Term Portfolio Simulation

To simulate a portfolio:

Steps:

1 Define investment schedule

    monthly / yearly contributions

2 Define asset returns

    bonds
    stocks
    cash

3 Generate future value

    apply compounding

4 Adjust for inflation

    RealValue = Nominal / InflationFactor

------------------------------------------------------------------------

# 13. Monte Carlo Simulation

Monte Carlo models random economic paths.

Example algorithm:

1 Generate random inflation 2 Generate random returns 3 Compute
portfolio value 4 Repeat thousands of times

Output:

    distribution of outcomes

------------------------------------------------------------------------

# 14. Example Portfolio Model

Example portfolio:

    60% bonds
    20% cash
    20% stocks

Assumed returns:

  Asset    Return
  -------- --------
  bonds    4%
  stocks   7%
  cash     2%

Portfolio return:

    0.6×4% + 0.2×2% + 0.2×7%
    = 4.2%

------------------------------------------------------------------------

# 15. Long-Term Example

Monthly investment:

    500 PLN

Annual return:

    4.5%

30 years.

Future value:

    ≈ 346,000 PLN

If inflation is:

    3%

Real value:

    ≈ 142,000 PLN

------------------------------------------------------------------------

# 16. Economic Indicators Useful for Simulation

Important variables:

  Indicator         Meaning
  ----------------- ---------------------
  Inflation         price growth
  Interest rates    cost of money
  GDP growth        economic expansion
  Unemployment      labor market health
  Government debt   fiscal stability

These indicators influence bond markets.

------------------------------------------------------------------------

# 17. Modeling Economic Scenarios

Example economic regimes:

### Stable Economy

    inflation 2%
    interest rates 3%
    GDP growth 3%

### Inflation Shock

    inflation 8%
    interest rates 10%
    GDP growth 0%

### Recession

    inflation 1%
    interest rates 1%
    GDP growth −2%

Simulations should test multiple regimes.

------------------------------------------------------------------------

# 18. Application Architecture Suggestion

Suggested modules:

    economic_engine
    portfolio_engine
    bond_pricing_engine
    inflation_adjustment
    tax_engine
    scenario_simulator

------------------------------------------------------------------------

# 19. Core Functions Needed

Examples:

    calculateCompoundInterest()
    calculateRealReturn()
    calculateBondGrowth()
    calculatePortfolioValue()
    calculateInflationAdjustment()
    simulateEconomicScenario()

------------------------------------------------------------------------

# 20. Final Insight

For long‑term investors:

    Real return = nominal return − inflation − taxes − fees

Understanding this equation is the **foundation of safe investing
analysis**.
