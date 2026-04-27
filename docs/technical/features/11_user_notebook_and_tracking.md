# 11. User Notebook & Tracking

The "Notebook" is a feature for users who want to move from simulation to tracking their actual (or planned) investments.

## 1. Concept: The "Virtual Portfolio"
The Notebook allows users to record their purchases without linking to a bank or brokerage. It is a manual-entry tracking tool.

## 2. Key Data Points per Entry
- **Bond/Asset Type:** (e.g., EDO-0834).
- **Purchase Date:** To calculate the exact interest period.
- **Quantity/Amount:** (e.g., 50 bonds or 5,000 PLN).
- **Account Type:** (e.g., "Standard", "IKE", "IKZE") - this affects the tax logic (0% vs 19%).

## 3. Dashboard Views
- **Total Value:** Sum of all current net values.
- **Aggregated Growth:** Area chart showing the evolution of the entire portfolio value over 10+ years.
- **Liquidity Calendar:** Forecast of cash-flow events, grouping maturities by month to identify "dead zones".
- **Tax Optimization Audit:** Diagnostic tool flagging taxable holdings that could benefit from IKE/IKZE wrappers.

## 4. Performance Metrics
- **Personal Inflation Rate:** How your specific portfolio is performing against current CPI.
- **Tax Savings Tracker:** Total amount of Belka tax avoided through tax-sheltered accounts.
- **Strategy Insight:** Automated advice on ladder maintenance and reinvestment frequency.

## 5. Persistence & Privacy
- **Anonymous Mode:** Data is stored in the browser's `IndexedDB`. If the user clears their cache, data is lost.
- **Encrypted Sync (Future):** Optional account creation where data is encrypted client-side before being synced to the server.
- **Export/Import:** Users can download a JSON file of their notebook to keep as a backup.

## 6. Alerts & Notifications (Optional)
- "Your TOS-0521 bonds are maturing in 30 days. Don't forget to check the rollover discount!"
- "New CPI data published: Your EDO bonds interest rate will change to 7.5% next month."
