# 17. Functional Requirements

This document lists the specific features the platform must deliver.

## 1. Instrument Management
- **FR1.1:** Browse all current and historical Polish retail bond issues.
- **FR1.2:** View current NBP reference rate and latest GUS inflation data.
- **FR1.3:** Search for assets by ticker, name, or ISIN.

## 2. Calculation Engines
- **FR2.1:** Calculate Net Profit for any Polish bond from purchase to maturity.
- **FR2.2:** Simulate early redemption at any date with correct fee and tax logic.
- **FR2.3:** Calculate inflation-linked interest using the correct 2-month lag.
- **FR2.4:** Support recurring investment simulations (Bond Ladders).
- **FR2.5:** Apply "Rollover Discount" logic to maturing bond simulations.

## 3. Comparison & Analysis
- **FR3.1:** Compare up to 3 instruments on a single interactive chart.
- **FR3.2:** Normalize all comparisons to a single currency (PLN) using historical FX.
- **FR3.3:** Toggle between "Nominal" and "Real" (Inflation-Adjusted) views.
- **FR3.4:** Show "Max Drawdown" and "Recovery Time" for market assets.

## 4. Planning & Tracking
- **FR4.1:** Retirement Planner with goal-based asset allocation suggestions.
- **FR4.2:** Manual investment notebook (add, edit, delete holdings).
- **FR4.3:** "Liquidation Value" summary for the entire notebook.
- **FR4.4:** Maturity calendar/timeline for saved investments.

## 5. Data & Persistence
- **FR5.1:** Persist "Saved Scenarios" and "Notebook" data in browser `IndexedDB`.
- **FR5.2:** Export calculation results to PDF/CSV.
- **FR5.3:** Import/Export notebook data via JSON file.

## 6. Education & Content
- **FR6.1:** Contextual tooltips for all financial terminology.
- **FR6.2:** Integrated blog/article system for deep-dives.
- **FR6.3:** Searchable Glossary.
