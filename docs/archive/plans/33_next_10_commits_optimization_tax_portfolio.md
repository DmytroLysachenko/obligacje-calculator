# 33. Next 10 Commits Plan: Optimization, Tax, and Portfolio Intelligence (COMPLETED)

This plan has been fully implemented across 5 logical commits.

## Summary of Implementation:
- **Milestone A & B**: Implemented Smart Bond Finder, Tax Wrapper Limits, and Inflation Scenarios.
- **Milestone C**: Developed Portfolio-Wide Timeline, Liquidity Calendar, and Tax Audit.
- **Milestone D**: Added Calculation Audit Trace and Professional PDF Export.

Status: ✅ DONE (2026-04-12)

The focus shifts toward **Phase 3 (Intelligence & Integration)** of the roadmap:
- Helping users **choose** the right bond (Optimization)
- Modeling realistic **tax constraints** (Annual IKE/IKZE limits)
- Strengthening **multi-asset** comparison using DB-backed history
- Improving **portability** of results (PDF/Exports)

## Commit Sequence

### Commit 1. Smart Bond Finder: Goal-Based Recommendation
**Goal**: Help users find the mathematically optimal bond for a specific duration.
**Scope**:
- Create a "Find Best Bond" mini-tool or mode.
- User inputs: Duration (e.g., 3.5 years) and Amount.
- Logic: Automatically runs simulations across all current offers and returns a ranked list based on `netPayoutValue`.
- Surfaces "The Winner" with a clear explanation of why (e.g., "COI wins because of early redemption fee structure at year 3").

### Commit 2. Dynamic IKE/IKZE Annual Limit Modeling
**Goal**: Account for realistic tax-wrapper constraints.
**Scope**:
- Add annual contribution limit logic (fetched from DB or constants for 2024/2025).
- Allow users to "overflow" contributions: amounts above the limit are modeled as a "Standard Account" (19% tax) within the same simulation.
- Show "Tax Savings" specifically attributed to the wrapper.

### Commit 3. PDF Summary Generator (Client-Side)
**Goal**: Allow users to save and share their professional-grade simulations.
**Scope**:
- Integrate a lightweight PDF library (e.g., `react-pdf` or `jspdf`).
- Generate a clean, branded 1-page report containing:
  - Scenario assumptions.
  - Final Gross/Net/Real values.
  - The main Value Evolution chart.
  - Key "What it means" bullets.

### Commit 4. Asset Catalog Expansion: Gold and major Indices
**Goal**: Make "Multi-Asset" comparison credible with real history.
**Scope**:
- Seed `data_series` for Gold (XAUPLN), S&P 500 (SPX), and WIG20.
- Update `SyncEngine` to fetch these from Stooq/WorldBank providers.
- Expose these in the `MultiAssetComparisonContainer` as primary benchmark options.

### Commit 5. Real ROI Backtester: "What if I bought in..."
**Goal**: Provide historical validation of bond performance.
**Scope**:
- Add a "Backtest" toggle to the Single Bond Calculator.
- User selects a past date (e.g., Jan 2018).
- Engine uses **actual historical CPI and NBP rates** from the DB for all periods up to "Today", then switches to "Projected" for the future.
- Visually mark the "Today" line on the chart.

### Commit 6. Portfolio Performance: Time-Weighted Return (TWR)
**Goal**: Provide advanced analytics for the Notebook feature.
**Scope**:
- Implement TWR calculation for user portfolios.
- Show "Actual Growth" vs "Benchmark Growth" (e.g., Portfolio vs Inflation).
- Add a "Performance" tab to the Portfolio Details view.

### Commit 7. Advanced Scenario Comparison: Reinvestment Shock
**Goal**: Visualize the impact of macro volatility on different reinvestment strategies.
**Scope**:
- Add "Macro Shocks" to Comparison: e.g., "What if inflation jumps to 15% in year 3?".
- Compare "Hold EDO" vs "Roll COI" under these shock conditions.
- Highlight the "Break-even" point where one strategy overtakes the other.

### Commit 8. Multi-Portfolio Aggregation & Global Dashboard
**Goal**: Support users with multiple investment goals (e.g., "Retirement" vs "House").
**Scope**:
- Update `NotebookContainer` to show a "Total Net Worth" summary across all portfolios.
- Allow filtering the main Landing Dashboard by specific portfolio.
- Add "Total Portfolio Health" metrics (Diversification, Liquidity Score).

### Commit 9. Deep Educational Context: Formula Tooltips
**Goal**: Become the ultimate "Source of Truth" for bond math.
**Scope**:
- Add "View Formula" icons next to interest calculations in the Explainer.
- Popovers show the actual math used (e.g., `Capital * (1 + rate)^year`) with current values plugged in.
- Link directly to the specific section of the `/education` page.

### Commit 10. Final Product Polish & Production Health Audit
**Goal**: Ensure 100% stability and observability.
**Scope**:
- Final i18n audit (ensure 100% `pl`/`en` parity for new internal tools).
- Implement basic structured logging for calculation errors (Sentry/LogSnag).
- Clean up remaining `TODO` comments in the `bond-core` engine.
- Update `README.md` with the new feature capability list.

## Recommended Milestones

### Milestone A: Intelligence & Advice (Commits 1-2)
- Moves beyond "Calculator" to "Advisor".

### Milestone B: Professional Tools (Commits 3-5)
- Adds exports and real-world historical data backing.

### Milestone C: Advanced Portfolio Mastery (Commits 6-8)
- Turns the Notebook into a serious wealth management tracker.

### Milestone D: Transparency & Scale (Commits 9-10)
- Hardens the platform for public trust and growth.
