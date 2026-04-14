# 36. Detailed Implementation: Immediate Performance & "Infra-Light" Reactivity

This document outlines 18 commits focused on making the platform faster, more reliable, and data-rich using ONLY existing resources (Next.js, Drizzle, React, and Web Workers) and free public APIs.

---

## Milestone A: Ultra-Responsive Calculation Loop

### Commit 1: In-Memory Calculation Memoization (Local Map)
- **Goal**: Stop re-calculating the same math during slider movements.
- **Implementation**:
  - **Files**: `features/bond-core/utils/calculation-cache.ts`.
  - **Logic**: Use a simple `Map<string, CalculationResult>` to store results. The key is a serialized string of the *math-relevant* inputs (nominal, date, inflation, rate).
  - **Cleanup**: Implement a basic "Least Recently Used" (LRU) policy by clearing the map if it exceeds 100 entries to keep memory usage low.

### Commit 2: Non-Blocking UI: Worker Abort & Throttle
- **Goal**: Ensure the main thread stays at 60fps during heavy calculations.
- **Implementation**:
  - **Files**: `shared/hooks/useCalculationWorker.ts`.
  - **Mechanism**: Use `requestAnimationFrame` to throttle worker messages to once every 16ms (max 60 times/sec).
  - **Abort**: Implement an ID-based tracking system. If a new request is sent before the previous one returns, the UI ignores the "stale" result from the older request.

### Commit 3: High-Performance Chart Rendering (Canvas/Decimation)
- **Goal**: Prevent SVG "DOM bloat" in long-horizon charts.
- **Implementation**:
  - **Files**: `shared/components/BondChart.tsx`.
  - **Logic**: For simulations >20 years, skip every other data point when rendering the line (`data.filter((_, i) => i % 2 === 0)`). 
  - **Optimization**: Disable Recharts animations (`isAnimationActive={false}`) during active user interaction to eliminate CPU spikes.

---

## Milestone B: "Right Here, Right Now" UX Interactivity

### Commit 4: Unified Tooltip & Cross-Chart Scrubbing
- **Goal**: Synchronize data inspection across the page.
- **Implementation**:
  - **Files**: `shared/context/ChartSyncContext.tsx`.
  - **Logic**: Use a standard React Context to share the `hoverIndex`.
  - **Behavior**: Hovering over the "Portfolio Growth" chart automatically moves the tooltips on the "Annual Interest" and "Tax Paid" charts without any additional network requests.

### Commit 5: Reactive "Draggable" Macro Assumptions
- **Goal**: Direct manipulation of inflation/rate paths.
- **Implementation**:
  - **Files**: `shared/components/MacroAdjuster.tsx`.
  - **Logic**: Use a small set of draggable "control points" (e.g., Target Inflation in Year 1, 5, and 10). 
  - **Math**: Use linear interpolation (`lerp`) to fill the gaps between control points, creating a full monthly path for the engine.

### Commit 6: "Belka Tax Leak" Visualizer
- **Goal**: Instant visualization of the IKE/IKZE advantage.
- **Implementation**:
  - **Files**: `shared/components/TaxLeakChart.tsx`.
  - **Logic**: Calculate the cumulative difference between standard and tax-free scenarios purely in the frontend.
  - **UI**: Add a shaded "Opportunity Cost" area to the chart, showing exactly how many thousands of PLN are "leaking" to taxes in the standard scenario.

---

## Milestone C: Operational Reliability & Data Gateway

### Commit 7: Next.js Route Memoization (Tag-Based)
- **Goal**: Speed up API responses without Redis.
- **Implementation**:
  - **Files**: `app/api/calculate/single/route.ts`.
  - **Logic**: Use Next.js `unstable_cache` or a simple global `Map` (since Next.js keeps the process alive between requests in many environments) to cache expensive DB lookups for bond definitions and historical CPI.

### Commit 8: Math "Sanity Guard" & Edge Case Hardening
- **Goal**: Eliminate `NaN` or `Infinite` results from extreme inputs.
- **Implementation**:
  - **Files**: `features/bond-core/utils/engine-guards.ts`.
  - **Logic**: Add strict bounds to inputs (e.g., Inflation cannot be <-50% or >500%). 
  - **Protection**: Wrap the core loop in a `try/catch` and return a "Safe Default" result with a warning flag if the math becomes unstable.

### Commit 9: Unified Financial Data Gateway (GUS/NBP/Stooq)
- **Goal**: Abstract data fetching from external public resources.
- **Implementation**:
  - **Files**: `lib/sync/data-gateway.ts`.
  - **Sources**: 
    - **GUS BDL API**: Official CPI and interest rates.
    - **NBP Web API**: Current and historical exchange rates.
    - **Stooq CSV**: Unofficial but reliable WIBOR 3M/6M/1Y data.
    - **Eurostat API**: HICP inflation for EU-wide comparisons.
  - **Logic**: A single service that fetches, validates, and normalizes data for the internal engine.

### Commit 10: Rule-Based "Smart Advisor" (Pure JS Logic)
- **Goal**: Provide insights without complex AI.
- **Implementation**:
  - **Files**: `features/bond-core/utils/advisor-rules.ts`.
  - **Logic**: Create a library of "Financial Heuristics" (e.g., "If COI interest is lower than current EDO margin, suggest switching").
  - **UI**: Render these as small "Advisor Tips" next to the results, calculating the potential gain in real-time.

---

## Milestone D: Portfolio Efficiency & Maintenance

### Commit 11: Batch Portfolio Simulations (Client-Side Parallelism)
- **Goal**: Rapidly update large portfolios in the Notebook.
- **Implementation**:
  - **Files**: `features/portfolio/hooks/usePortfolioSimulation.ts`.
  - **Logic**: Use `Promise.all` to send multiple lot calculation requests to the Web Worker simultaneously. 
  - **Performance**: Aggregate the results into a "Total Portfolio View" only once all worker tasks are complete.

### Commit 12: Transparency: "How it was Calculated" Trace UI
- **Goal**: Build trust through total transparency.
- **Implementation**:
  - **Files**: `shared/components/CalculationTrace.tsx`.
  - **Logic**: Expose the "Audit Trail" already generated by the engine (the yearly event logs).
  - **UI**: A collapsible table showing: `Capital * Rate = Interest -> Tax -> Reinvested Capital`.

### Commit 13: 2026 Regulatory Audit & Data Refresh
- **Goal**: Final project maintenance for the current year.
- **Implementation**:
  - **Files**: `db/schema.ts`, `db/seed.ts`.
  - **Task**: Update IKE/IKZE limits and current bond series for 2026.
  - **Cleanup**: Run a final "Dead Code" audit—remove unused imports, deprecated constants, and stale comments.

---

## Milestone E: Advanced Sourcing, Performance & System Integrity

### Commit 14: Automated Seeding & Maintenance Pipeline
- **Goal**: Transition from static seeds to dynamic, up-to-date financial data.
- **Implementation**:
  - **Files**: `db/seed-all-metadata.ts`, `scripts/update-financial-data.ts`.
  - **Logic**: Integrate the Data Gateway (Commit 9) into the seeding process. Add a sync command that fetches missing historical data without affecting existing user records.

### Commit 15: Off-Thread Data Extraction & Transformation (Web Workers)
- **Goal**: Keep the UI responsive while processing large external datasets.
- **Implementation**:
  - **Files**: `shared/workers/data-processor.worker.ts`.
  - **Logic**: Offload raw data parsing (transforming large CSVs from Stooq or complex JSON from Eurostat) and heavy data validation to a background worker.

### Commit 16: Core Logic Refactoring (SOLID/DRY/KISS)
- **Goal**: Improve code quality, maintainability, and scalability.
- **Implementation**:
  - **Action**: 
    - **SOLID**: Apply Dependency Inversion to data sources.
    - **DRY**: Consolidate redundant calculation logic across different bond types.
    - **KISS**: Simplify complex state-reduction logic in the Portfolio view.
  - **Files**: `features/bond-core/application-service.ts`, `features/portfolio/utils/`.

### Commit 17: Performance & Security Audit
- **Goal**: Ensure production readiness and data safety.
- **Implementation**:
  - **Performance**: Use React Profiler and Lighthouse to identify and fix rendering bottlenecks in the "Compare" and "Ladder" views.
  - **Security**: Implement strict input validation on all API routes, check for data leaks in client-side state, and ensure secure HTTP headers are configured.
  - **Files**: `next.config.ts`, `lib/api-handler.ts`.

### Commit 18: High-Level Logic & UX Sanity Check
- **Goal**: Final verification of mathematical correctness and intuitive UX.
- **Implementation**:
  - **Logic**: Conduct a "sanity check" of the investment engine's results against manual calculations for edge cases (e.g., negative inflation, early redemption on specific dates).
  - **UX**: Verify that the "Advisor" tips and "Trace UI" provide clear, actionable, and correct information that matches user expectations.

---

## Recommended Execution Order
1. **Foundation (Immediate Speed)**: Commits 1, 2, 3, 7 (Internal caching & Worker health)
2. **Data & Trust (Reliability)**: Commits 8, 9, 14, 15 (Math safety, API Gateway, and Background Processing)
3. **Features (Interactive Value)**: Commits 4, 5, 6, 10, 12 (UX, Advisor tips, and Transparency)
4. **Scale & Quality**: Commits 11, 16, 17, 18 (Portfolio batching, Refactoring, and Full Audits)
5. **Maintenance**: Commit 13 (2026 update)
