# Obligacje Calculator - Project Roadmap

## Phase 1: Core Foundation (Done)
- [x] Initial architecture with feature-based structure.
- [x] Internationalization (i18n) setup.
- [x] Core Bond Calculator logic.
- [x] Single Bond Calculator UI.
- [x] Documentation for Polish Treasury Bonds.

## Phase 2: Enhanced Calculations & UI (Done)
- [x] Support for all Polish bond types (OTS, ROR, DOR, TOS, COI, ROS, EDO, ROD).
- [x] Improved visualizations (Recharts integration).
- [x] Multi-language support (Polish translation).
- [x] Detailed yearly reports and timeline audit metadata.
- [x] Canonical simulation output for unified rendering.

## Phase 3: Advanced Simulators (Done)
- [x] **Recurring Investment Calculator:** Monthly/Quarterly/Yearly contribution modeling.
- [x] **Goal-Seek Mode:** Reverse calculation to find required investment.
- [x] **Portfolio Simulation:** Aggregating multiple bonds into a single performance view.
- [x] **Ladder Strategy:** Modeling rolling bond ladders.

## Phase 4: Data & Reliability (Done)
- [x] DB-backed historical data (Inflation, NBP Rate, WIBOR).
- [x] Automated bond definition sync via scraping layer.
- [x] Advanced IKZE modeling with tax relief and payout tax.
- [x] Extensive regression test suite (40+ cases).

## Phase 5: Personal Features (Done)
- [x] User authentication (NextAuth).
- [x] Private portfolio tracking (Notebook).
- [x] Portfolio performance tracking.
- [x] Export to PDF.

## Phase 6: Intelligence & Optimization (Done)
- [x] **Smart Bond Finder:** Multi-bond parallel simulation for duration-based recommendations.
- [x] **Tax Wrapper Limits:** Modeling annual contribution caps and taxable overflows.
- [x] **Portfolio Intelligence:** Liquidity calendars and tax health audits.
- [x] **Inflation Scenarios:** outcome volatility visualization (Low/Base/High).
- [x] **Historical Backtesting:** Automatic series matching for past purchases.
- [x] **Transparency Audit:** Step-by-step interest calculation traces.

## Phase 7: Advanced Analytics & Social Connectivity (In Progress)
- [ ] **Tax Health Audit:** Automated identification of tax-inefficient lots.
- [ ] **Retirement Planner:** Sustainable withdrawal projections based on bond ladders.
- [ ] **Interactive Scenario Painter:** User-drawn macro paths for real-time simulation.
- [ ] **Public Portfolio Sharing:** Secure read-only links for sharing insights.
- [ ] **Community Insights:** Anonymized market sentiment and popularity index.
- [ ] **Enterprise-Grade Reliability:** Full Playwright E2E suite and worker resilience.

---

## Technical Principles
- **Accuracy:** Calculations validated against official treasury rules and rounded per Tax Ordinance.
- **Trust:** Transparent assumptions, warnings, and "How it was calculated" explainer.
- **Speed:** API response time under 200ms for complex portfolio simulations.
- **Maintainability:** Pure domain engine, rich schema, and type-safe scenario contracts.
