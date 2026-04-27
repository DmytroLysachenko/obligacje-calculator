# 09. Comparative Simulations

The comparison engine is designed to help users understand the trade-offs between safety and potential return.

## 1. The Comparison Framework
Comparing a Bond to Bitcoin is like comparing an "Escalator" to a "Rollercoaster." We use specific metrics to make the comparison meaningful:

- **Max Drawdown:** The largest peak-to-trough drop. (Bonds = 0% nominal, Equity = -20% to -50%).
- **Time to Recovery:** How long it takes to return to the previous peak.
- **Real Return:** Profitability after subtracting inflation.
- **Liquidity:** How fast can you get your cash out?

## 2. Simulation Modes

### A. Static Comparison (Historical)
- "Show me 10,000 PLN in EDO vs. S&P 500 between 2015 and 2025."
- Uses actual historical prices and CPI.

### C. Smart Bond Finder (Optimizer)
- "I want to invest 50,000 PLN for exactly 4.5 years. Which bond is best?"
- **Parallel Simulation:** The engine runs all 8+ bond types simultaneously for the exact requested duration.
- **Duration Normalization:** It accounts for early redemption fees if the horizon doesn't match maturity.
- **Ranked Recommendations:** Returns a ranked list based on `netPayoutValue` with a clear "Winner" reason.

### D. Inflation Scenario Volatility
- Users can toggle between **Low / Base / High** inflation paths.
- **Visual Range:** Charts display dotted lines for alternative scenarios, showing how indexed bonds (EDO/COI) respond to macro changes compared to fixed-rate bonds.

## 3. Visualization Strategy
- **Overlay Chart:** Multiple lines on one time-axis.
- **"The Wall of Worry":** Highlighting periods where the risky asset was in the red while the bond was steadily climbing.
- **Summary Cards:**
  - "The Bond path gave you **certainty** of X."
  - "The Equity path gave you **potential** for Y, but with Z months of stress."

## 4. Handling Taxes in Comparison
- **Bonds:** 19% deducted at the end.
- **Stocks:** 19% on capital gains (and potentially on dividends).
- The engine must account for the **Dividend Tax** (usually 19%) for S&P 500 simulations to be fair.

## 5. The "Comfort Zone" Metric
A unique UI element that asks: "Can you handle a 20% drop in your portfolio?" 
If the user says "No," the simulator highlights the Bond path as the "Recommended Foundation."
