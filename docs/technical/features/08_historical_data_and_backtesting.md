# 08. Historical Data & Backtesting

To provide realistic simulations, the platform relies on high-quality historical data.

## 1. Data Sources

| Asset Class | Source | Frequency | Purpose |
| :--- | :--- | :--- | :--- |
| **Inflation (CPI)** | GUS (Statistics Poland) | Monthly | Calculating historical bond returns |
| **NBP Rates** | National Bank of Poland | On Event | Floating rate bond calculations |
| **Equities (S&P 500)** | Stooq / Yahoo Finance | Daily | Benchmarking and comparisons |
| **Crypto (BTC)** | CoinGecko / Stooq | Daily | Risk/Reward visualizations |
| **Gold** | NBP / Stooq | Daily | Commodity hedging simulations |

## 2. Inflation Data Handling
- **The "Final" CPI:** GUS publishes final CPI data for the previous month around the 15th day of the current month.
- **The "Flash" CPI:** Published on the last day of the month. The platform should use "Final" data for accuracy.
- **Data Gap:** For the current month and future months, the engine defaults to a user-defined "Expected Inflation" value.

## 3. Backtesting Logic
Users can select a historical start date (e.g., "What if I bought COI in 2018?").
- **Automatic Series Discovery:** The engine queries the database to find the exact bond series active on the selected purchase date.
- **Parameter Mapping:** It automatically applies the first-year rate and margin that were available during that specific emission month.
- **Historical Data Injection:** It applies actual GUS CPI and NBP rates for all months from purchase until "Today".
- **Hybrid Projections:** For periods beyond today, it seamlessly switches to the user's "Expected Inflation" assumptions.
- **Visual Feedback:** Timeline points are badged as "Historical" or "Projected" for full transparency.

## 4. Currency Normalization
- Historical data for S&P 500 is in USD.
- The platform must apply the historical **USD/PLN exchange rate** to show the return from the perspective of a Polish investor.

## 5. Data Persistence & Performance
- Historical series are stored in a local database (Drizzle/Postgres) to avoid repeated API calls.
- A background job (Inngest) updates these values daily/monthly.
- UI components fetch pre-calculated "Chart Data" aggregates for performance.
