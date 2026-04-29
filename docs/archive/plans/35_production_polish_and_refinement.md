# 35. Next 15 Commits: Production Polish, UX Harmony & Data Reliability

This plan focuses on transitioning the "Obligacje Calculator" from a functional prototype to a production-ready application. The emphasis is on UI/UX consistency, mobile excellence, API robustness, and professional-grade features.

## Milestone A: UI/UX Harmony & Mobile Excellence

**Goal**: Ensure a seamless, high-quality experience across all devices and features.

1. **Commit 1: Unified Page Architecture with `CalculatorPageShell`**
   - Refactor `Compare`, `Ladder`, `Regular Investment`, and `Portfolio` pages to use the shared `CalculatorPageShell`.
   - Standardize page headers, icons, and "Recalculate" button placement.

2. **Commit 2: Mobile-First Responsive Overhaul**
   - Implement a "Sheet" (drawer) based sidebar for mobile devices.
   - Optimize all calculation tables and charts for small screens (horizontal scroll for tables, touch-friendly tooltips for charts).
   - Ensure the "Sticky Recalculate" action is reachable on mobile.

3. **Commit 3: Global Motion & Transition System**
   - Add subtle Page Transitions using Framer Motion.
   - Implement "Loading Skeletons" for all major result areas to prevent layout shift during calculation.
   - Add micro-interactions (hover states, click ripples) to primary buttons.

4. **Commit 4: "Empty State" & Onboarding Professionalism**
   - Design and implement high-quality empty states for the Notebook, Comparison list, and Charts.
   - Add a "Quick Start" guide or "Demo Mode" that populates the calculator with sensible defaults for first-time users.

## Milestone B: API Robustness & Developer Experience

**Goal**: Harden the backend and provide better observability.

5. **Commit 5: Standardized API Layer (Zod + Middleware)**
   - Wrap all API routes in a shared handler that enforces Zod schema validation.
   - Implement standardized error responses (RFC 7807 Problem Details).
   - Add basic rate-limiting for public calculation endpoints.

6. **Commit 6: Real-time Sync Health Dashboard**
   - Create a `/admin/status` dashboard showing the health of NBP, GUS, and Stooq syncs.
   - Visualize "Data Gaps" in the database (e.g., missing CPI months).
   - Add a "Trigger Manual Sync" button with progress reporting.

7. **Commit 7: Performance Optimization: Calculation Web Worker**
   - Move the core `bond-core` execution to a Web Worker to ensure the UI thread never hangs, even for complex 100-lot portfolios.
   - Implement a calculation "Debounce" and "Cancel" logic for rapid slider adjustments.

## Milestone C: Professional Features & Exports

**Goal**: Add the "Polish" that sets professional tools apart.

8. **Commit 8: Branded PDF Report Generator**
   - Replace basic PDF export with a professionally styled multi-page report.
   - Include: Branded header, "Executive Summary", "Assumptions Audit", and high-res Chart exports.

9. **Commit 9: Smart "Math Deep-Dive" Overlays**
   - Add "How was this calculated?" icons next to every major result.
   - Clicking opens a side-panel with a step-by-step breakdown: `(Nominal * (1+Rate)) - Tax - Fee = Net`.
   - Link specific variables directly to the `/education` glossary.

10. **Commit 10: User Preferences & Multi-Device Sync**
    - Implement a `user_settings` table in the DB.
    - Persist preferences: `currency` (PLN/EUR), `default_inflation_scenario`, `theme` (Light/Dark/System), and `chart_type` (Area/Line).

## Milestone D: Calculation Intelligence & "Pro" Advice

**Goal**: Move from "Raw Math" to "Investment Insights".

11. **Commit 11: Real-Time Strategy Hints (The "Optimizer" Lite)**
    - Add "Smart Hints" to the results area: e.g., "EDO might be 0.5% better here due to lower early redemption fees if you sell in Year 3".
    - Highlight "Tax Efficiency" warnings if the user is near IKE/IKZE limits.

12. **Commit 12: Historical "What If" Contextualization**
    - Show a "Historical Range" overlay on future projection charts (e.g., "Your 5% inflation assumption is within the 10-year average of 4.2% - 6.1%").

## Milestone E: Reliability, SEO & Launch Readiness

**Goal**: Final hardening before public promotion.

13. **Commit 13: E2E Smoke Test Suite (Playwright)**
    - Implement automated tests for the "Golden Path": Landing -> Single Calculation -> Save to Notebook -> View Portfolio.
    - Ensure i18n switching doesn't break calculation state.

14. **Commit 14: Final i18n Audit & Content Polish**
    - 100% parity check between `pl.json` and `en.json`.
    - Professional copy-edit of all `/education` content for clarity and financial accuracy.
    - Fix all remaining `TODO` and `console.log` entries in the codebase.

15. **Commit 15: Production-Ready Metadata & SEO Excellence**
    - Implement full JSON-LD schema for `FinancialValue`, `CalculateAction`, and `FAQPage`.
    - Finalize `robots.txt`, `sitemap.ts`, and OpenGraph images for all major sub-pages.
    - Add a "Version Info" and "Last Data Sync" footer to build trust.

## Recommended Order of Execution

1. **Consistency First** (Commits 1, 2, 4)
2. **Robustness** (Commits 5, 6, 7)
3. **Professionalism** (Commits 8, 9, 10, 14)
4. **Intelligence** (Commits 11, 12)
5. **Final Hardening** (Commits 13, 15)
