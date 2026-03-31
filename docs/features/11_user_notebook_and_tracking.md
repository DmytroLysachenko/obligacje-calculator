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
- **Maturity Calendar:** A timeline showing when specific bonds will expire.
- **Expected Payouts:** A bar chart of upcoming coupon payments (for COI bonds).
- **Liquidation Value:** "If I sold everything today, how much would hit my bank account?" (Accounts for early redemption fees).

## 4. Performance Metrics
- **Personal Inflation Rate:** How your specific portfolio is performing against current CPI.
- **Weighted Average Yield:** The effective interest rate across all holdings.

## 5. Persistence & Privacy
- **Anonymous Mode:** Data is stored in the browser's `IndexedDB`. If the user clears their cache, data is lost.
- **Encrypted Sync (Future):** Optional account creation where data is encrypted client-side before being synced to the server.
- **Export/Import:** Users can download a JSON file of their notebook to keep as a backup.

## 6. Alerts & Notifications (Optional)
- "Your TOS-0521 bonds are maturing in 30 days. Don't forget to check the rollover discount!"
- "New CPI data published: Your EDO bonds interest rate will change to 7.5% next month."
